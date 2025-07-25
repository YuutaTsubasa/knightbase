export type AudioGroupId = "bgm" | "sfx" | string;

export interface AudioGroupConfig {
  loop?: boolean;
  volume?: number;
}

export const audioGroupSettings: Record<AudioGroupId, AudioGroupConfig> = {
  bgm: {
    loop: true,
    volume: 0.5,
  },
  sfx: {
    loop: false,
    volume: 0.5,
  },
};