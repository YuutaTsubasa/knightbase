import { writable } from "svelte/store";

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

export interface PlayerData {
  name: string;
  level: number;
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
}

const DEFAULT_PLAYER_DATA : PlayerData = {
    name: "Player00000",
    level: 0,
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
    stageRecords: {}
}

export class PlayerDataManager {
  private static STORAGE_KEY = "playerData";
  private static data: PlayerData = PlayerDataManager.load();

  static load(): PlayerData {
    const base64 = localStorage.getItem(this.STORAGE_KEY);
    if (base64) {
      try {
        const json = atob(base64);
        const parsed = JSON.parse(json);
        return this.data = this.mergeDefaults(DEFAULT_PLAYER_DATA, parsed);
      } catch {
        return this.data = DEFAULT_PLAYER_DATA;
      }
    }
    return this.data = DEFAULT_PLAYER_DATA;
  }

  private static mergeDefaults<T>(defaults: T, actual: any): T {
    const result: any = { ...defaults };
    for (const key in defaults) {
      if (typeof defaults[key] === "object" && defaults[key] !== null) {
        result[key] = this.mergeDefaults(defaults[key], actual?.[key] ?? {});
      } else {
        result[key] = actual?.[key] ?? defaults[key];
      }
    }
    return result;
  }

  static save(): void {
    const json = JSON.stringify(this.data);
    const base64 = btoa(json);
    localStorage.setItem(this.STORAGE_KEY, base64);
  }

  static getData(): PlayerData {
    return this.data;
  }

  static update(partial: Partial<PlayerData>): void {
    Object.assign(this.data, partial);
    this.save();
  }

  static exportBase64(): string {
    return btoa(JSON.stringify(this.data));
  }

  static importBase64(encoded: string): void {
    const json = atob(encoded);
    this.data = JSON.parse(json);
    this.save();
  }

  static reset(): void {
    this.data = DEFAULT_PLAYER_DATA;
    this.save();
  }

  // Resource management methods
  static addResources(resources: Partial<PlayerResources>): void {
    if (resources.gold) this.data.resources.gold += resources.gold;
    if (resources.diamond) this.data.resources.diamond += resources.diamond;
    if (resources.gem) this.data.resources.gem += resources.gem;
    this.save();
  }

  static spendResources(resources: Partial<PlayerResources>): boolean {
    const canAfford = 
      (resources.gold || 0) <= this.data.resources.gold &&
      (resources.diamond || 0) <= this.data.resources.diamond &&
      (resources.gem || 0) <= this.data.resources.gem;
    
    if (canAfford) {
      if (resources.gold) this.data.resources.gold -= resources.gold;
      if (resources.diamond) this.data.resources.diamond -= resources.diamond;
      if (resources.gem) this.data.resources.gem -= resources.gem;
      this.save();
      return true;
    }
    return false;
  }

  // Stage record management methods
  static updateStageRecord(stageId: string, stats: { time: number; score: number; speed: number }): boolean {
    const existing = this.data.stageRecords[stageId];
    let isNewRecord = false;

    if (!existing) {
      this.data.stageRecords[stageId] = {
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
    }

    this.save();
    return isNewRecord;
  }

  static getStageRecord(stageId: string): StageRecord | null {
    return this.data.stageRecords[stageId] || null;
  }
}

export const playerStore = writable<PlayerData>(PlayerDataManager.getData());

// 訂閱時更新本地儲存
playerStore.subscribe((value) => {
  PlayerDataManager.update(value);
});