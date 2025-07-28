import { writable } from "svelte/store";

export interface PlayerData {
  name: string;
  level: number;
  experience: number;
  title: string;
  masterVolume: number,
  bgmVolume: number,
  sfxVolume: number,
}

const DEFAULT_PLAYER_DATA : PlayerData = {
    name: "Player00000",
    level: 0,
    experience: 0,
    title: "Newbie Player",
    masterVolume: 50,
    bgmVolume: 50,
    sfxVolume: 50
}

export class PlayerDataManager {
  private static STORAGE_KEY = "playerData";
  private static data: PlayerData = PlayerDataManager.load();

  static load(): PlayerData {
    const base64 = localStorage.getItem(this.STORAGE_KEY);
    if (base64) {
      try {
        const json = atob(base64);
        return this.data = JSON.parse(json);
      } catch {
        return this.data = DEFAULT_PLAYER_DATA;
      }
    }
    return this.data = DEFAULT_PLAYER_DATA;
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
}

export const playerStore = writable<PlayerData>(PlayerDataManager.getData());

// 訂閱時更新本地儲存
playerStore.subscribe((value) => {
  PlayerDataManager.update(value);
});