import { get, writable, type Writable } from "svelte/store";

export interface StageRecord {
  bestTime: number; // in seconds
  bestScore: number;
  bestSpeed: number; // in multiplier (e.g., 8.5)
  completed: boolean;
}

export interface PlayerResources {
  gold: number;
  diamond: number;
  gem: number;
}

export interface PlayerStatistics {
  totalLoginDays: number;
  lastLoginDate: string; // YYYY-MM-DD format
  currentLoginStreak: number;
  totalLevelPlays: number;
  totalJumps: number;
  totalAttacks: number;
}

export interface MissionProgress {
  dailyMissions: Record<string, number[]>; // "YYYY-MM-DD" -> [missionId1, missionId2, ...]
  weeklyMissions: Record<string, number[]>; // "YYYY-MM-DD" (Monday) -> [missionId1, missionId2, ...]
  achievementMissions: number[]; // [missionId1, missionId2, ...]
}

export interface PlayerData {
  name: string;
  experience: number;
  selectedTitle: string;
  selectedCharacter: string;
  selectedStage: string;
  masterVolume: number,
  bgmVolume: number,
  sfxVolume: number,
  locale?: string,
  resources: PlayerResources;
  stageRecords: Record<string, StageRecord>; // stageId -> record
  statistics: PlayerStatistics;
  missionProgress: MissionProgress;
}

const DEFAULT_PLAYER_DATA : PlayerData = {
    name: "Player00000",
    experience: 0,
    selectedTitle: "playerTitle1",
    selectedCharacter: "yuuta",
    selectedStage: "stage1",
    masterVolume: 50,
    bgmVolume: 50,
    sfxVolume: 50,
    locale: undefined,
    resources: {
      gold: 0,
      diamond: 0,
      gem: 0
    },
    stageRecords: {},
    statistics: {
      totalLoginDays: 0,
      lastLoginDate: "",
      currentLoginStreak: 0,
      totalLevelPlays: 0,
      totalJumps: 0,
      totalAttacks: 0
    },
    missionProgress: {
      dailyMissions: {},
      weeklyMissions: {},
      achievementMissions: []
    }
}
const STORAGE_KEY = "playerData";
export const playerStore: Writable<PlayerData> = writable(load());

function load(): PlayerData {
  const base64 = localStorage.getItem(STORAGE_KEY);
  if (base64) {
    try {
      const json = atob(base64);
      const parsed = JSON.parse(json);
      const merged = mergeDefaults(DEFAULT_PLAYER_DATA, parsed);
      
      return merged;
    } catch {
      return DEFAULT_PLAYER_DATA;
    }
  }

  return DEFAULT_PLAYER_DATA;
}

function mergeDefaults<T extends Record<string, any>>(defaults: T, actual: T): T {
  const result: any = { ...defaults };
  for (const key of Object.keys(actual)) {
    if (typeof defaults[key] === "object" && defaults[key] !== null) {
      result[key] = mergeDefaults(defaults[key], actual?.[key] ?? {});
    } else {
      result[key] = actual?.[key] ?? defaults[key];
    }
  }
  return result;
}

function save(data: PlayerData): void {
  const json = JSON.stringify(data);
  const base64 = btoa(json);
  localStorage.setItem(STORAGE_KEY, base64);
}

playerStore.subscribe((data) => {
  save(data);
});

export function exportBase64FromSaveData(): string {
  return btoa(JSON.stringify(get(playerStore)));
}

export function importBase64ToSaveData(encoded: string): void {
  const json = atob(encoded);
  playerStore.set(JSON.parse(json));
}

export function addResourcesToSaveData(resources: Partial<PlayerResources>): void {
  playerStore.update((currentData) => {
    if (resources.gold) currentData.resources.gold += resources.gold;
    if (resources.diamond) currentData.resources.diamond += resources.diamond;
    if (resources.gem) currentData.resources.gem += resources.gem;
    return currentData;
  });
}
export function spendResourcesFromSaveData(resources: Partial<PlayerResources>): boolean {
  let isSpent = false;
  playerStore.update((currentData) => {
    const { resources: currentResources } = currentData;
    if (!currentResources) return currentData;

    const canAfford =
      (resources.gold || 0) <= currentResources.gold &&
      (resources.diamond || 0) <= currentResources.diamond &&
      (resources.gem || 0) <= currentResources.gem;

    if (canAfford) {
      if (resources.gold) currentData.resources.gold -= resources.gold;
      if (resources.diamond) currentData.resources.diamond -= resources.diamond;
      if (resources.gem) currentData.resources.gem -= resources.gem;
      isSpent = true;
      return currentData;
    }
    return currentData;
  });

  return isSpent;
}

export function updateStageRecordToSaveData(stageId: string, stats: { time: number; score: number; speed: number }): boolean {
  let isNewRecord = false;
  playerStore.update((currentData) => {
    if (!currentData.stageRecords) {
      currentData.stageRecords = {};
    }
    const existing = currentData.stageRecords[stageId];
    if (!existing) {
      currentData.stageRecords[stageId] = {
        bestTime: stats.time,
        bestScore: stats.score,
        bestSpeed: stats.speed,
        completed: true
      };
      isNewRecord = true;
    } else {
      if (stats.time > existing.bestTime) {
        existing.bestTime = stats.time;
        isNewRecord = true;
      }
      if (stats.score > existing.bestScore) {
        existing.bestScore = stats.score;
        isNewRecord = true;
      }
      if (stats.speed > existing.bestSpeed) {
        existing.bestSpeed = stats.speed;
        isNewRecord = true;
      }
      existing.completed = true;
      currentData.stageRecords[stageId] = existing;
    }
    return currentData;
  });
  return isNewRecord;
}

export function addExperienceToSaveData(experience: number): { leveledUp: boolean; previousLevel: number; newLevel: number } {
  let levelUpData = { leveledUp: false, previousLevel: 0, newLevel: 0 };
  
  playerStore.update((currentData) => {
    const previousLevel = calculateLevel(currentData.experience);
    currentData.experience += experience;
    const newLevel = calculateLevel(currentData.experience);
    
    levelUpData = {
      leveledUp: newLevel > previousLevel,
      previousLevel,
      newLevel
    };
    
    return currentData;
  });
  
  return levelUpData;
}

export function calculateLevel(experience: number): number {
  return Math.floor(experience / 10000) + 1;
}

export function getPlayerLevel(): number {
  const currentData = get(playerStore);
  return calculateLevel(currentData.experience);
}

export function getExperiencePercentForCurrentLevel(): number {
  const currentData = get(playerStore);
  const currentLevel = calculateLevel(currentData.experience);
  const experienceForCurrentLevel = (currentLevel - 1) * 10000;
  const experienceInCurrentLevel = currentData.experience - experienceForCurrentLevel;
  return experienceInCurrentLevel / 10000;
}

// Mission and statistics tracking functions

export function recordLogin(): void {
  playerStore.update((currentData) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
    // Update login statistics
    if (currentData.statistics.lastLoginDate !== today) {
      currentData.statistics.totalLoginDays++;
      
      // Calculate login streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      if (currentData.statistics.lastLoginDate === yesterdayStr) {
        currentData.statistics.currentLoginStreak++;
      } else {
        currentData.statistics.currentLoginStreak = 1;
      }
      
      currentData.statistics.lastLoginDate = today;
    }
    
    return currentData;
  });
}

export function recordLevelPlay(): void {
  playerStore.update((currentData) => {
    currentData.statistics.totalLevelPlays++;
    return currentData;
  });
}

export function recordJump(): void {
  playerStore.update((currentData) => {
    currentData.statistics.totalJumps++;
    return currentData;
  });
}

export function recordAttack(): void {
  playerStore.update((currentData) => {
    currentData.statistics.totalAttacks++;
    return currentData;
  });
}

export function completeMission(missionId: number, missionType: 'daily' | 'weekly' | 'achievement'): void {
  playerStore.update((currentData) => {
    switch (missionType) {
      case 'daily': {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        if (!currentData.missionProgress.dailyMissions[today]) {
          currentData.missionProgress.dailyMissions[today] = [];
        }
        if (!currentData.missionProgress.dailyMissions[today].includes(missionId)) {
          currentData.missionProgress.dailyMissions[today].push(missionId);
        }
        break;
      }
      case 'weekly': {
        // Get Monday of current week
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        const mondayStr = monday.toISOString().slice(0, 10);
        
        if (!currentData.missionProgress.weeklyMissions[mondayStr]) {
          currentData.missionProgress.weeklyMissions[mondayStr] = [];
        }
        if (!currentData.missionProgress.weeklyMissions[mondayStr].includes(missionId)) {
          currentData.missionProgress.weeklyMissions[mondayStr].push(missionId);
        }
        break;
      }
      case 'achievement': {
        if (!currentData.missionProgress.achievementMissions.includes(missionId)) {
          currentData.missionProgress.achievementMissions.push(missionId);
        }
        break;
      }
    }
    
    return currentData;
  });
}

export function isMissionCompleted(missionId: number, missionType: 'daily' | 'weekly' | 'achievement'): boolean {
  const currentData = get(playerStore);
  
  switch (missionType) {
    case 'daily': {
      const today = new Date().toISOString().slice(0, 10);
      return currentData.missionProgress.dailyMissions[today]?.includes(missionId) ?? false;
    }
    case 'weekly': {
      // Get Monday of current week
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      const mondayStr = monday.toISOString().slice(0, 10);
      
      return currentData.missionProgress.weeklyMissions[mondayStr]?.includes(missionId) ?? false;
    }
    case 'achievement': {
      return currentData.missionProgress.achievementMissions.includes(missionId);
    }
  }
}

export function getPlayerStatistics(): PlayerStatistics {
  const currentData = get(playerStore);
  return currentData.statistics;
}