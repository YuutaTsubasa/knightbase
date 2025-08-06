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
  private groundY: number = 480;
  private levelCompleted: boolean = false;
  private goalReached: boolean = false;
  private patternsLoaded: boolean = false;
  private lastGenerationTime: number = 0;
  private generationInterval: number = 2000; // Generate every 2 seconds

  constructor(stageId: string, groundY: number = 480) {
    this.groundY = groundY;
    this.loadLevel(stageId);
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

  public update(deltaTime: number): { enemies: Enemy[], coins: Coin[], traps: Trap[], goals: Goal[] } {
    const result = { enemies: [] as Enemy[], coins: [] as Coin[], traps: [] as Trap[], goals: [] as Goal[] };

    // Don't start generating until patterns are loaded
    if (!this.patternsLoaded) {
      return result;
    }

    // Check if level is completed
    if (this.currentPatternIndex >= this.patterns.length) {
      if (!this.levelCompleted) {
        this.levelCompleted = true;
        console.log('Level completed!');
      }
      return result;
    }

    // Check if it's time to generate the next pattern
    this.lastGenerationTime += deltaTime;
    if (this.lastGenerationTime >= this.generationInterval) {
      this.lastGenerationTime = 0;

      // Generate current pattern if not yet done
      const currentPattern = this.patterns[this.currentPatternIndex];
      if (currentPattern) {
        console.log(`Generating pattern ${this.currentPatternIndex}: ${currentPattern.name}`);
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

        // Move to next pattern
        this.currentPatternIndex++;
        
        // Calculate next X position (includes gap patterns)
        if (currentPattern.name === 'gap') {
          // Cast to access gap-specific methods
          const gapPattern = currentPattern as any;
          if (gapPattern.getDistance) {
            this.currentX += gapPattern.getDistance();
          } else {
            this.currentX += 200; // Default gap
          }
        } else {
          // For other patterns, add some default spacing
          this.currentX += 400;
        }
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
    this.levelCompleted = false;
    this.goalReached = false;
    this.lastGenerationTime = 0;
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