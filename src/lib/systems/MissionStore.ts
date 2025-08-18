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

  // Prerequisite mapping for achievement missions
  private readonly missionPrerequisites: Record<number, number> = {
    // Login progression: 7→14→21→28→35→42→49→56→63→70 days
    102: 101, // login14 requires login7
    103: 102, // login21 requires login14
    104: 103, // login28 requires login21
    105: 104, // login35 requires login28
    106: 105, // login42 requires login35
    107: 106, // login49 requires login42
    108: 107, // login56 requires login49
    109: 108, // login63 requires login56
    110: 109, // login70 requires login63

    // Level play progression: 5→10→15→20→25→30→35→40→45→50 plays
    202: 201, // totalPlays10 requires totalPlays5
    203: 202, // totalPlays15 requires totalPlays10
    204: 203, // totalPlays20 requires totalPlays15
    205: 204, // totalPlays25 requires totalPlays20
    206: 205, // totalPlays30 requires totalPlays25
    207: 206, // totalPlays35 requires totalPlays30
    208: 207, // totalPlays40 requires totalPlays35
    209: 208, // totalPlays45 requires totalPlays40
    210: 209, // totalPlays50 requires totalPlays45

    // Jump progression: 50→100→150→200→250→300→350→400→450→500 jumps
    302: 301, // totalJumps100 requires totalJumps50
    303: 302, // totalJumps150 requires totalJumps100
    304: 303, // totalJumps200 requires totalJumps150
    305: 304, // totalJumps250 requires totalJumps200
    306: 305, // totalJumps300 requires totalJumps250
    307: 306, // totalJumps350 requires totalJumps300
    308: 307, // totalJumps400 requires totalJumps350
    309: 308, // totalJumps450 requires totalJumps400
    310: 309, // totalJumps500 requires totalJumps450

    // Attack progression: 50→100→150→200→250→300→350→400→450→500 attacks
    402: 401, // totalAttacks100 requires totalAttacks50
    403: 402, // totalAttacks150 requires totalAttacks100
    404: 403, // totalAttacks200 requires totalAttacks150
    405: 404, // totalAttacks250 requires totalAttacks200
    406: 405, // totalAttacks300 requires totalAttacks250
    407: 406, // totalAttacks350 requires totalAttacks300
    408: 407, // totalAttacks400 requires totalAttacks350
    409: 408, // totalAttacks450 requires totalAttacks400
    410: 409, // totalAttacks500 requires totalAttacks450
  };

  static getInstance(): MissionStoreClass {
    if (!MissionStoreClass.instance) {
      MissionStoreClass.instance = new MissionStoreClass();
    }
    return MissionStoreClass.instance;
  }

  /**
   * Check if a mission's prerequisites are satisfied
   * @param missionId The mission ID to check
   * @param missionType The mission type
   * @returns true if all prerequisites are claimed, false otherwise
   */
  private isMissionUnlocked(missionId: number, missionType: MissionType): boolean {
    // Daily and weekly missions don't have prerequisites
    if (missionType !== 'achievement') {
      return true;
    }

    const prerequisiteId = this.missionPrerequisites[missionId];
    if (!prerequisiteId) {
      // No prerequisite, mission is unlocked
      return true;
    }

    // Check if prerequisite mission has been claimed
    return isMissionCompleted(prerequisiteId, 'achievement');
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

        const processedMissions = $missionData
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
          })
          // Filter missions based on prerequisites (only for achievement missions)
          .filter(mission => this.isMissionUnlocked(mission.id, missionType))
          // Sort missions: unclaimed first, then claimed at the end
          .sort((a, b) => {
            // Primary sort: claimed missions go to end
            if (a.claimed !== b.claimed) {
              return a.claimed ? 1 : -1;
            }
            // Secondary sort: by mission ID to maintain consistent order
            return a.id - b.id;
          });

        return processedMissions;
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

}

export const MissionStore = MissionStoreClass.getInstance();