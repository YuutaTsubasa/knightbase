import { PlayerDataManager } from "$lib/systems/PlayerStore";
import { parse } from 'papaparse';
import { writable, get, type Writable, derived } from "svelte/store";

const FILE_PATH = "/assets/localizations/localization.csv"
const DEFAULT_LOCALE = "en-us";
const NOTHING = "#NOTHING#";
export class LocalizationAssets {
  static data: Writable<Record<string, Record<string, string>>> = writable({});
  static locale = writable(DEFAULT_LOCALE);
  
  static getLocale() {
    return get(this.locale);
  }

  static detectUserLocale() {
    for (const lang of navigator.languages) {
      const normalized = lang.toLowerCase();
      const supportedLocales = get(this.availableLocales);
      if (supportedLocales.includes(normalized)) {
        return normalized;
      }
    }
    return DEFAULT_LOCALE;
  }

  static async initialize() {
    if (Object.entries(get(this.data)).length > 0)
      return;

    await this.load();
    this.locale.set(PlayerDataManager.getData().locale ?? LocalizationAssets.detectUserLocale());
  }

  static async load() {
    const res = await fetch(FILE_PATH);
    const text = await res.text();
    const parsed = parse(text, { header: true }).data as Array<Record<string, string>>;
    const langKeys = Object.keys(parsed[0] ?? {}).filter(k => k !== 'key');
    const newData = langKeys
      .reduce<Record<string, Record<string, string>>>((localizationObject, lang) => {
        localizationObject[lang] = Object.values(parsed)
          .reduce((reducedValue, row) => {
            reducedValue[row['key']] = row[lang] ?? '';
            return reducedValue;
          }, {});
        return localizationObject;
      }, {});
    this.data.set(newData);
    console.info(get(this.data));
  }

  static preprocess(value: string): string {
    return value === NOTHING ? "" : value;
  }

  static availableLocales = derived(
    [LocalizationAssets.data],
    ([$data]) => Object.keys($data));

  static setLocale(newLocale: string) {
    if (!get(this.data)[newLocale]) 
      return;

    this.locale.set(newLocale);
    PlayerDataManager.update({locale: newLocale});
  }
}

export const t = derived(
  [LocalizationAssets.locale, LocalizationAssets.data],
  ([$locale, $data]) => {
    return (key: string) => {
      const lang = $locale.toLowerCase();
      const value = $data[lang]?.[key];
      if (value && value !== "") return LocalizationAssets.preprocess(value);

      const fallback = $data[DEFAULT_LOCALE]?.[key];
      if (fallback && fallback !== "") return LocalizationAssets.preprocess(fallback);

      return key;
    };
  }
);