import { parse } from 'papaparse';
import { writable, get, type Writable } from "svelte/store";

// Define interfaces for all static data types
export interface PlayerData {
  playerLevel: number;
  playerExp: number;
}

export interface CharacterData {
  characterId: number;
  characterNameKey: string;
  characterDescriptionKey: string;
  BaseHp: number;
  BaseSp: number;
  BaseAtk: number;
  BaseDef: number;
  BaseSkillCd: number;
}

export interface CharacterLevelAbilityData {
  characterId: number;
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
  missionConditions: string;
}

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

  private static loadedFiles: Set<string> = new Set();

  static async initialize() {
    const promises = [
      this.loadPlayerData(),
      this.loadCharacterData(),
      this.loadCharacterLevelAbilityData(),
      this.loadItemData(),
      this.loadEquipmentData(),
      this.loadPoisonData(),
      this.loadShopData(),
      this.loadMissionData()
    ];

    try {
      await Promise.all(promises);
      console.info('Static data loaded successfully');
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
      const parsed = parse(text, { header: true, skipEmptyLines: true }).data as T[];
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

  // Utility methods to get data by ID
  static getCharacterById(id: number): CharacterData | undefined {
    const characters = get(this.characterData);
    return characters.find(char => char.characterId === id);
  }

  static getItemById(id: number): ItemData | undefined {
    const items = get(this.itemData);
    return items.find(item => item.ItemId === id);
  }

  static getShopItemsByCategory(categoryId: number): ShopData[] {
    const shopItems = get(this.shopData);
    return shopItems.filter(item => item.shopCategoryId === categoryId);
  }

  static getMissionsByCategory(categoryId: number): MissionData[] {
    const missions = get(this.missionData);
    return missions.filter(mission => mission.missionCategoryId === categoryId);
  }

  static getCharacterLevelAbility(characterId: number, level: number): CharacterLevelAbilityData | undefined {
    const abilities = get(this.characterLevelAbilityData);
    return abilities.find(ability => ability.characterId === characterId && ability.characterLevel === level);
  }

  static getEquipmentById(itemId: number): EquipmentData | undefined {
    const equipment = get(this.equipmentData);
    return equipment.find(eq => eq.ItemId === itemId);
  }

  static getPoisonById(itemId: number): PoisonData | undefined {
    const poisons = get(this.poisonData);
    return poisons.find(poison => poison.ItemId === itemId);
  }
}