import { derived, get, writable, type Readable } from 'svelte/store';
import { StaticDataStore, type MissionData } from './StaticDataStore';
import { playerStore, addResourcesToSaveData, addExperienceToSaveData, completeMission, isMissionCompleted, getPlayerStatistics, getDailyConditionCounter, getWeeklyConditionCounter, type PlayerStatistics } from './PlayerStore';
import { MISSION_CATEGORY, MISSION_CATEGORY_ID, type MissionCategory } from '../utils/Constant';
import { getGameDate, getGameWeekMonday } from '../utils/GameTime';

export interface MissionReward {
  type: 'exp' | 'gold' | 'diamond' | 'ruby';
  amount: number;
}

export interface ProcessedMissionData {
  id: number;
  nameKey: string;
  descriptionKey: string;
  iconKey: string;
  conditions: string;
  category: MissionCategory;
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

  private getMissionRewards(mission: MissionData): MissionReward[] {
    const rewards: MissionReward[] = [];
    
    if (mission.rewardExp > 0) {
      rewards.push({ type: 'exp', amount: mission.rewardExp });
    }
    if (mission.rewardGold > 0) {
      rewards.push({ type: 'gold', amount: mission.rewardGold });
    }
    if (mission.rewardDiamond > 0) {
      rewards.push({ type: 'diamond', amount: mission.rewardDiamond });
    }
    if (mission.rewardRuby > 0) {
      rewards.push({ type: 'ruby', amount: mission.rewardRuby });
    }
    
    return rewards;
  }

  private getMissionType(categoryId: number): MissionType {
    switch (categoryId) {
      case MISSION_CATEGORY_ID[MISSION_CATEGORY.DAILY]: return MISSION_CATEGORY.DAILY;
      case MISSION_CATEGORY_ID[MISSION_CATEGORY.WEEKLY]: return MISSION_CATEGORY.WEEKLY;
      case MISSION_CATEGORY_ID[MISSION_CATEGORY.ACHIEVEMENT]: return MISSION_CATEGORY.ACHIEVEMENT;
      default: return MISSION_CATEGORY.DAILY;
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
          const today = getGameDate();
          current = statistics.lastLoginDate === today ? 1 : 0;
        } else if (mission.missionCategoryId === MISSION_CATEGORY_ID[MISSION_CATEGORY.WEEKLY]) {
          // Weekly login days - check unique login days this week
          current = this.getWeeklyLoginDays();
        } else {
          // Achievement - total login days
          current = statistics.totalLoginDays;
        }
        break;
      case 'level_play':
        if (mission.missionCategoryId === MISSION_CATEGORY_ID[MISSION_CATEGORY.DAILY]) {
          // Daily - check if played today
          current = this.getTodayLevelPlays();
        } else if (mission.missionCategoryId === MISSION_CATEGORY_ID[MISSION_CATEGORY.WEEKLY]) {
          // Weekly - check plays this week
          current = this.getWeeklyLevelPlays();
        } else {
          // Achievement - total plays
          current = statistics.totalLevelPlays;
        }
        break;
      case 'jump':
        if (mission.missionCategoryId === MISSION_CATEGORY_ID[MISSION_CATEGORY.DAILY]) {
          current = this.getTodayJumps();
        } else if (mission.missionCategoryId === MISSION_CATEGORY_ID[MISSION_CATEGORY.WEEKLY]) {
          current = this.getWeeklyJumps();
        } else {
          current = statistics.totalJumps;
        }
        break;
      case 'attack':
        if (mission.missionCategoryId === MISSION_CATEGORY_ID[MISSION_CATEGORY.DAILY]) {
          current = this.getTodayAttacks();
        } else if (mission.missionCategoryId === MISSION_CATEGORY_ID[MISSION_CATEGORY.WEEKLY]) {
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
        const categoryId = MISSION_CATEGORY_ID[missionType];
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
              category: missionType,
              rewards: this.getMissionRewards(mission),
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
      } else if (reward.type === 'diamond') {
        addResourcesToSaveData({ diamond: reward.amount });
      } else if (reward.type === 'ruby') {
        addResourcesToSaveData({ ruby: reward.amount });
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
    const currentGameDate = getGameDate(now);
    const currentGameWeek = getGameWeekMonday(now);
    
    // For a complete implementation, we would check:
    // 1. If daily missions need refresh (new game day started)
    // 2. If weekly missions need refresh (new game week started)
    // 3. Compare with last refresh timestamps stored in player data
    
    // This is a simplified check - in practice you'd want to store
    // last refresh dates in player data and compare
    const hour = now.getHours();
    return hour === 5 && now.getMinutes() === 0; // Refresh at exactly 5:00 AM
  }
}

export const MissionStore = MissionStoreClass.getInstance();