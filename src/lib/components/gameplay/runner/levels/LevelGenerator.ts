import { Pattern } from '../objects/Pattern';
import { PatternFactory } from '../patterns/PatternFactory';
import { TextAssetManager } from '$lib/assets/TextAssets';
import { Enemy } from '../objects/Enemy';
import { Coin } from '../objects/Coin';
import { Trap } from '../objects/Trap';
import { Goal } from '../objects/Goal';
import type { PatternEntity } from '../objects/Pattern';

export class LevelGenerator {
  private patterns: Pattern[] = [];
  private currentPatternIndex: number = 0;
  private currentX: number = 800; // Start off-screen
  private playerDistanceTraveled: number = 0; // Track player's actual distance
  private groundY: number = 480;
  private levelCompleted: boolean = false;
  private goalReached: boolean = false;
  private patternsLoaded: boolean = false;
  private loadPromise: Promise<void>;

  constructor(stageId: string, groundY: number = 480) {
    this.groundY = groundY;
    this.loadPromise = this.loadLevel(stageId);
  }

  public waitForLoad(): Promise<void> {
    return this.loadPromise;
  }

  private async loadLevel(stageId: string): Promise<void> {
    try {
      const patternData = await TextAssetManager.loadPatternData(stageId);
      this.patterns = PatternFactory.createPatternsFromJson(patternData);
      this.patternsLoaded = true;
      console.log(`Loaded level ${stageId} with ${this.patterns.length} patterns`);
    } catch (error) {
      console.error(`Failed to load level ${stageId}:`, error);
      // Fallback to empty level
      this.patterns = [];
      this.patternsLoaded = true;
    }
  }

  public update(deltaTime: number, currentScrollSpeed: number, playerDistanceTraveled: number): { enemies: Enemy[], coins: Coin[], traps: Trap[], goals: Goal[] } {
    const result = { enemies: [] as Enemy[], coins: [] as Coin[], traps: [] as Trap[], goals: [] as Goal[] };

    // Don't start generating until patterns are loaded
    if (!this.patternsLoaded) {
      return result;
    }

    // Update player distance
    this.playerDistanceTraveled = playerDistanceTraveled;

    // Check if level is completed
    if (this.currentPatternIndex >= this.patterns.length) {
      if (!this.levelCompleted) {
        this.levelCompleted = true;
        console.log('Level completed!');
      }
      return result;
    }

    // Check if we should generate the next pattern based on distance
    // Generate when player has traveled close enough to the next pattern position
    const generationDistance = 400; // Generate when player is 400 pixels from pattern
    if (this.playerDistanceTraveled + generationDistance >= this.currentX) {
      // Generate current pattern if not yet done
      const currentPattern = this.patterns[this.currentPatternIndex];
      if (currentPattern) {
        console.log(`Generating pattern ${this.currentPatternIndex}: ${currentPattern.name} at distance ${this.currentX}`);
        const objects = currentPattern.createObjects(this.currentX, this.groundY);
        
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

        // Move to next pattern and update currentX based on pattern distance
        this.currentPatternIndex++;
        this.currentX += currentPattern.getDistance();
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
  }

  public isPatternsLoaded(): boolean {
    return this.patternsLoaded;
  }

  public getTotalPatterns(): number {
    return this.patterns.length;
  }

  public getCurrentProgress(): number {
    return this.patterns.length > 0 ? this.currentPatternIndex / this.patterns.length : 0;
  }
}