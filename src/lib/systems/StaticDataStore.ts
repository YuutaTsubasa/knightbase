import { parse } from 'papaparse';
import { writable, get, type Writable, derived } from "svelte/store";

// Define interfaces for all static data types
export interface PlayerData {
  playerLevel: number;
  playerExp: number;
}

export interface CharacterData {
  characterId: string;
  characterNameKey: string;
  characterDescriptionKey: string;
  BaseHp: number;
  BaseSp: number;
  BaseAtk: number;
  BaseDef: number;
  BaseSkillCd: number;
}

export interface CharacterLevelAbilityData {
  characterId: string;
  characterLevel: number;
  characterExp: number;
  IncreasedHp: number;
  IncreasedSp: number;
  IncreasedAtk: number;
  IncreasedDef: number;
  IncreasedSkillCd: number;
}

export interface ItemData {
  ItemId: number;
  ItemNameKey: string;
  ItemDescriptionKey: string;
  ItemIconKey: string;
}

export interface EquipmentData {
  ItemId: number;
  IncreasedHp: number;
  IncreasedSp: number;
  IncreasedAtk: number;
  IncreasedDef: number;
  IncreasedSkillCd: number;
}

export interface PoisonData {
  ItemId: number;
  duration: number;
  IncreasedHp: number;
  IncreasedSp: number;
  IncreasedAtk: number;
  IncreasedDef: number;
  IncreasedSkillCd: number;
}

export interface ShopData {
  shopId: number;
  shopCategoryId: number;
  merchandiseId: number;
  itemId: number;
  cost: number;
}

export interface MissionData {
  missionId: number;
  missionCategoryId: number;
  missionTitleKey: string;
  missionDescriptionKey: string;
  missionIconKey: string;
  missionConditions: string;
}

export type StageData = {
  id: string;
  nameKey: string;
  iconSvg: string;
  descriptionKey: string;
  groundOffsetY: number;
};

// Main StaticDataStore class
export class StaticDataStore {
  private static basePath = "/assets/staticData/";
  
  // Store for each data type
  static playerData: Writable<PlayerData[]> = writable([]);
  static characterData: Writable<CharacterData[]> = writable([]);
  static characterLevelAbilityData: Writable<CharacterLevelAbilityData[]> = writable([]);
  static itemData: Writable<ItemData[]> = writable([]);
  static equipmentData: Writable<EquipmentData[]> = writable([]);
  static poisonData: Writable<PoisonData[]> = writable([]);
  static shopData: Writable<ShopData[]> = writable([]);
  static missionData: Writable<MissionData[]> = writable([]);
  static stageData: Writable<StageData[]> = writable([]);

  private static loadedFiles: Set<string> = new Set();

  static async initialize() {
    if (this.loadedFiles.size > 0) {
      return;
    }

    const promises = [
      this.loadPlayerData(),
      this.loadCharacterData(),
      this.loadCharacterLevelAbilityData(),
      this.loadItemData(),
      this.loadEquipmentData(),
      this.loadPoisonData(),
      this.loadShopData(),
      this.loadMissionData(),
      this.loadStageData(),
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to load some static data:', error);
    }
  }

  private static async loadCsvFile<T>(filename: string): Promise<T[]> {
    if (this.loadedFiles.has(filename)) {
      return [];
    }

    try {
      const res = await fetch(this.basePath + filename);
      const text = await res.text();
      const parsed = parse(text, { 
        header: true, 
        skipEmptyLines: true,
        dynamicTyping: true  // This will automatically convert strings to numbers/booleans where appropriate
      }).data as T[];
      this.loadedFiles.add(filename);
      return parsed;
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error);
      return [];
    }
  }

  static async loadPlayerData() {
    const data = await this.loadCsvFile<PlayerData>('player.csv');
    this.playerData.set(data);
  }

  static async loadCharacterData() {
    const data = await this.loadCsvFile<CharacterData>('character.csv');
    this.characterData.set(data);
  }

  static async loadCharacterLevelAbilityData() {
    const data = await this.loadCsvFile<CharacterLevelAbilityData>('characterLevelAbility.csv');
    this.characterLevelAbilityData.set(data);
  }

  static async loadItemData() {
    const data = await this.loadCsvFile<ItemData>('item.csv');
    this.itemData.set(data);
  }

  static async loadEquipmentData() {
    const data = await this.loadCsvFile<EquipmentData>('equipment.csv');
    this.equipmentData.set(data);
  }

  static async loadPoisonData() {
    const data = await this.loadCsvFile<PoisonData>('poison.csv');
    this.poisonData.set(data);
  }

  static async loadShopData() {
    const data = await this.loadCsvFile<ShopData>('shop.csv');
    this.shopData.set(data);
  }

  static async loadMissionData() {
    const data = await this.loadCsvFile<MissionData>('mission.csv');
    this.missionData.set(data);
  }

  static async loadStageData() {
    const data = await this.loadCsvFile<StageData>('stage.csv');
    this.stageData.set(data);
  }

  // Utility methods to get data by ID
  static getCharacterById = (id: string) =>
    derived(this.characterData, (characterData) =>
      characterData.find((char) => char.characterId === id)
    );

  static getItemById = (id: number) =>
    derived(this.itemData, (itemData) =>
      itemData.find((item) => item.ItemId === id)
    );

  static getShopItemsByCategory = (categoryId: number) =>
    derived(this.shopData, (shopData) =>
      shopData.filter((item) => item.shopCategoryId === categoryId)
    );

  static getMissionByCategory = (categoryId: number) =>
    derived(this.missionData, (missionData) =>
      missionData.filter((mission) => mission.missionCategoryId === categoryId)
    );

  static getCharacterLevelAbility = (characterId: string, level: number) =>
    derived(this.characterLevelAbilityData, (abilityData) =>
      abilityData.find((ability) => ability.characterId === characterId && ability.characterLevel === level)
    );

  static getEquipmentById = (itemId: number) =>
    derived(this.equipmentData, (equipmentData) =>
      equipmentData.find((eq) => eq.ItemId === itemId)
    );

  static getPoisonById = (itemId: number) =>
    derived(this.poisonData, (poisons) =>
      poisons.find((poison) => poison.ItemId === itemId)
    );

  static getStageById = (id: string) =>
    derived(this.stageData, (stageData) =>
      stageData.find((stage) => stage.id === id)
    );
}