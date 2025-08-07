import { Pattern } from '../patterns/Pattern';
import { PatternFactory } from '../patterns/PatternFactory';
import { TextAssetManager } from '$lib/assets/TextAssets';
import { Enemy } from '../objects/Enemy';
import { Coin } from '../objects/Coin';
import { Trap } from '../objects/Trap';
import { Goal } from '../objects/Goal';
import type { PatternEntity } from '../patterns/Pattern';

export class LevelGenerator {
  private patterns: Pattern[] = [];
  private currentPatternIndex: number = 0;
  private currentX: number = 800; // Start off-screen
  private playerDistanceTraveled: number = 0; // Track player's actual distance
  private groundY: number = 480;
  private levelCompleted: boolean = false;
  private goalReached: boolean = false;
  private lastPatternGeneratedTime: number = 0; // Add cooldown tracking
  private minPatternInterval: number = 1000; // Minimum 1 second between patterns

  constructor(patterns: Pattern[], groundY: number = 480) {
    this.patterns = patterns;
    this.groundY = groundY;
    console.log(`Initialized level generator with ${this.patterns.length} patterns`);
  }

  public update(deltaTime: number, currentScrollSpeed: number, playerDistanceTraveled: number): { enemies: Enemy[], coins: Coin[], traps: Trap[], goals: Goal[] } {
    const result = { enemies: [] as Enemy[], coins: [] as Coin[], traps: [] as Trap[], goals: [] as Goal[] };

    // Update player distance
    this.playerDistanceTraveled = playerDistanceTraveled;

    // Check if level is completed
    if (this.currentPatternIndex >= this.patterns.length) {
      if (!this.levelCompleted) {
        this.levelCompleted = true;
        console.log('All patterns generated - but level completion requires reaching goal!');
      }
      return result;
    }

    // Check time-based cooldown to prevent rapid pattern generation
    const currentTime = performance.now();
    if (currentTime - this.lastPatternGeneratedTime < this.minPatternInterval) {
      return result; // Still in cooldown period
    }

    // Check if we should generate the next pattern based on distance
    // Generate when player has traveled close enough to the next pattern position
    const generationDistance = 600; // Increased from 400 to 600 pixels
    if (this.playerDistanceTraveled + generationDistance >= this.currentX) {
      // Generate ONLY the current pattern, then return - no loop
      const currentPattern = this.patterns[this.currentPatternIndex];
      if (currentPattern) {
        console.log(`Generating pattern ${this.currentPatternIndex}: ${currentPattern.name} at distance ${this.currentX} (player at ${this.playerDistanceTraveled})`);
        
        // Calculate relative position for the pattern (off-screen to the right)
        // Convert from absolute distance to relative screen position
        const relativeX = 800 + 50 + (this.currentX - this.playerDistanceTraveled);
        const objects = currentPattern.createObjects(relativeX, this.groundY);
        
        objects.forEach(obj => {
          if (obj instanceof Enemy) {
            result.enemies.push(obj);
          } else if (obj instanceof Coin) {
            result.coins.push(obj);
          } else if (obj instanceof Trap) {
            result.traps.push(obj);
          } else if (obj instanceof Goal) {
            result.goals.push(obj);
          }
        });

        // Update tracking variables
        this.currentPatternIndex++;
        this.currentX += currentPattern.getDistance();
        this.lastPatternGeneratedTime = currentTime; // Set cooldown
      }
    }

    return result;
  }

  public isLevelCompleted(): boolean {
    return this.levelCompleted;
  }

  public isGoalReached(): boolean {
    return this.goalReached;
  }

  public markGoalReached(): void {
    this.goalReached = true;
  }

  public reset(): void {
    this.currentPatternIndex = 0;
    this.currentX = 800;
    this.playerDistanceTraveled = 0;
    this.levelCompleted = false;
    this.goalReached = false;
    this.lastPatternGeneratedTime = 0; // Reset cooldown
  }

  public getTotalPatterns(): number {
    return this.patterns.length;
  }

  public getCurrentProgress(): number {
    return this.patterns.length > 0 ? this.currentPatternIndex / this.patterns.length : 0;
  }
}