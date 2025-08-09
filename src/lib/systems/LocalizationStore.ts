import { parse } from 'papaparse';
import { writable, get, type Writable, derived } from "svelte/store";
import { playerStore } from './PlayerStore';

const FILE_PATH = "/assets/staticData/localization.csv"
const DEFAULT_LOCALE = "en-us";
const NOTHING = "#NOTHING#";
export class LocalizationStore {
  static data: Writable<Record<string, Record<string, string>>> = writable({});
  static locale = writable<string>(DEFAULT_LOCALE);

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

  static initialize() {
    if (Object.entries(get(this.data)).length > 0)
      return Promise.resolve();

    // Start loading in background but don't block
    const loadPromise = this.load().then(() => {
      this.setLocale(get(playerStore).locale ?? LocalizationStore.detectUserLocale());
    })
    .catch(error => {
      console.warn('Failed to load localization assets:', error);
      // Set default locale even if loading fails
      this.setLocale(DEFAULT_LOCALE);
    })
    .finally(() => {
      this.locale.subscribe(
        (newLocale) => {
          playerStore.update((playerData) => ({
            ...playerData,
            locale: newLocale
          }));
        }
      );
    });
    return loadPromise;
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
  }

  static preprocess(value: string): string {
    return value === NOTHING ? "" : value;
  }

  static availableLocales = derived(
    [LocalizationStore.data],
    ([$data]) => Object.keys($data));

  static setLocale(newLocale: string) {
    if (!get(this.data)[newLocale]) 
      return;

    this.locale.set(newLocale);
  }
}

export const t = derived(
  [LocalizationStore.locale, LocalizationStore.data],
  ([$locale, $data]) => {
    return (key: string) => {
      const lang = $locale.toLowerCase();
      const value = $data[lang]?.[key];
      if (value && value !== "") return LocalizationStore.preprocess(value);

      const fallback = $data[DEFAULT_LOCALE]?.[key];
      if (fallback && fallback !== "") return LocalizationStore.preprocess(fallback);

      return key;
    };
  }
);