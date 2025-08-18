export const BACK_PATH = "$back";

// Animation Constants
// Seed value for pseudo-random entrance animation timing offsets
// Creates natural variation in level card entrance animations
export const ENTRANCE_ANIMATION_RANDOM_SEED = 12.34;

// Multiplier for pseudo-random calculations in animation timing
// Used to generate consistent pseudo-random values for animation delays
export const PSEUDO_RANDOM_MULTIPLIER = 10000;

// Seed value for marquee animation timing
// Controls the random delay for level name scrolling animation
export const MARQUEE_ANIMATION_SEED = 56.78;

// Seed value for shine animation timing  
// Controls the random delay for card shine effect animation
export const SHINE_ANIMATION_SEED = 90.12;

export enum ButtonVariant {
  Default
}

// Mission Category Constants
export const MISSION_CATEGORY = {
  DAILY: 'daily',
  WEEKLY: 'weekly', 
  ACHIEVEMENT: 'achievement'
} as const;

export type MissionCategory = typeof MISSION_CATEGORY[keyof typeof MISSION_CATEGORY];

// Mission Category ID mapping for backward compatibility with CSV data
export const MISSION_CATEGORY_ID = {
  [MISSION_CATEGORY.DAILY]: 1,
  [MISSION_CATEGORY.WEEKLY]: 2,
  [MISSION_CATEGORY.ACHIEVEMENT]: 4
} as const;