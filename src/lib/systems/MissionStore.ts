import { derived, get, writable, type Readable } from 'svelte/store';
import { StaticDataStore, type MissionData } from './StaticDataStore';
import { playerStore, addResourcesToSaveData, addExperienceToSaveData, completeMission, isMissionCompleted, getPlayerStatistics, getDailyConditionCounter, getWeeklyConditionCounter, type PlayerStatistics } from './PlayerStore';

export interface MissionReward {
  type: 'exp' | 'gold';
  amount: number;
}

export interface ProcessedMissionData {
  id: number;
  nameKey: string;
  descriptionKey: string;
  iconKey: string;
  conditions: string;
  categoryId: number;
  rewards: MissionReward[];
  completed: boolean;  // Whether conditions are met
  claimed: boolean;    // Whether reward has been claimed
  progress: {
    current: number;
    max: number;
  };
}

export type MissionType = 'daily' | 'weekly' | 'achievement';

class MissionStoreClass {
  private static instance: MissionStoreClass;

  static getInstance(): MissionStoreClass {
    if (!MissionStoreClass.instance) {
      MissionStoreClass.instance = new MissionStoreClass();
    }
    return MissionStoreClass.instance;
  }

  private getMissionRewards(missionId: number, categoryId: number): MissionReward[] {
    switch (categoryId) {
      case 1: // Daily missions
        return [{ type: 'exp', amount: 50 }, { type: 'gold', amount: 10 }];
      case 2: // Weekly missions
        return [{ type: 'exp', amount: 350 }, { type: 'gold', amount: 70 }];
      case 4: // Achievement missions
        return [{ type: 'exp', amount: 500 }, { type: 'gold', amount: 100 }];
      default:
        return [{ type: 'exp', amount: 50 }, { type: 'gold', amount: 10 }];
    }
  }

  private getMissionType(categoryId: number): MissionType {
    switch (categoryId) {
      case 1: return 'daily';
      case 2: return 'weekly';
      case 4: return 'achievement';
      default: return 'daily';
    }
  }

  private checkMissionProgress(mission: MissionData, statistics: PlayerStatistics): { current: number; max: number } {
    const [criteriaType, maxStr] = mission.missionConditions.split(':');
    const max = parseInt(maxStr) || 1;
    let current = 0;

    switch (criteriaType) {
      case 'login':
        if (max === 1) {
          // Daily login - check if logged in today
          const today = new Date().toISOString().slice(0, 10);
          current = statistics.lastLoginDate === today ? 1 : 0;
        } else if (mission.missionCategoryId === 2) {
          // Weekly login days - check unique login days this week
          current = this.getWeeklyLoginDays();
        } else {
          // Achievement - total login days or login streak
          current = statistics.totalLoginDays;
        }
        break;
      case 'login_streak':
        current = statistics.currentLoginStreak;
        break;
      case 'level_play':
        if (mission.missionCategoryId === 1) {
          // Daily - check if played today
          current = this.getTodayLevelPlays();
        } else if (mission.missionCategoryId === 2) {
          // Weekly - check plays this week
          current = this.getWeeklyLevelPlays();
        } else {
          // Achievement - total plays
          current = statistics.totalLevelPlays;
        }
        break;
      case 'jump':
        if (mission.missionCategoryId === 1) {
          current = this.getTodayJumps();
        } else if (mission.missionCategoryId === 2) {
          current = this.getWeeklyJumps();
        } else {
          current = statistics.totalJumps;
        }
        break;
      case 'attack':
        if (mission.missionCategoryId === 1) {
          current = this.getTodayAttacks();
        } else if (mission.missionCategoryId === 2) {
          current = this.getWeeklyAttacks();
        } else {
          current = statistics.totalAttacks;
        }
        break;
      default:
        current = 0;
    }

    return { current: Math.min(current, max), max };
  }

  private getTodayLevelPlays(): number {
    return getDailyConditionCounter('levelPlays');
  }

  private getWeeklyLevelPlays(): number {
    return getWeeklyConditionCounter('levelPlays');
  }

  private getWeeklyLoginDays(): number {
    return getWeeklyConditionCounter('loginDays');
  }

  private getTodayJumps(): number {
    return getDailyConditionCounter('jumps');
  }

  private getWeeklyJumps(): number {
    return getWeeklyConditionCounter('jumps');
  }

  private getTodayAttacks(): number {
    return getDailyConditionCounter('attacks');
  }

  private getWeeklyAttacks(): number {
    return getWeeklyConditionCounter('attacks');
  }

  getMissionsByType(missionType: MissionType): Readable<ProcessedMissionData[]> {
    return derived(
      [StaticDataStore.missionData, playerStore],
      ([$missionData, $playerData]) => {
        const categoryId = missionType === 'daily' ? 1 : missionType === 'weekly' ? 2 : 4;
        const statistics = $playerData.statistics;

        return $missionData
          .filter(mission => mission.missionCategoryId === categoryId)
          .map(mission => {
            const progress = this.checkMissionProgress(mission, statistics);
            const completed = progress.current >= progress.max;
            const claimed = isMissionCompleted(mission.missionId, missionType);

            return {
              id: mission.missionId,
              nameKey: mission.missionTitleKey,
              descriptionKey: mission.missionDescriptionKey,
              iconKey: mission.missionIconKey,
              conditions: mission.missionConditions,
              categoryId: mission.missionCategoryId,
              rewards: this.getMissionRewards(mission.missionId, mission.missionCategoryId),
              completed,
              claimed,
              progress
            };
          });
      }
    );
  }

  claimMissionReward(missionId: number, missionType: MissionType): boolean {
    if (isMissionCompleted(missionId, missionType)) {
      return false; // Already claimed
    }

    const missions = get(this.getMissionsByType(missionType));
    const mission = missions.find(m => m.id === missionId);
    
    if (!mission || !mission.completed || mission.claimed) {
      return false; // Mission not found, not completed, or already claimed
    }

    // Award rewards
    for (const reward of mission.rewards) {
      if (reward.type === 'exp') {
        addExperienceToSaveData(reward.amount);
      } else if (reward.type === 'gold') {
        addResourcesToSaveData({ gold: reward.amount });
      }
    }

    // Mark mission as completed (claimed)
    completeMission(missionId, missionType);
    
    return true;
  }

  claimAllRewards(missionType: MissionType): number {
    const missions = get(this.getMissionsByType(missionType));
    let claimedCount = 0;

    for (const mission of missions) {
      if (mission.completed && !mission.claimed) {
        if (this.claimMissionReward(mission.id, missionType)) {
          claimedCount++;
        }
      }
    }

    return claimedCount;
  }

  // Check if missions need to be refreshed (for daily/weekly)
  shouldRefreshMissions(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Refresh at 5:00 AM local time
    // For this implementation, we'll just return false as refresh logic would be more complex
    return false;
  }
}

export const MissionStore = MissionStoreClass.getInstance();