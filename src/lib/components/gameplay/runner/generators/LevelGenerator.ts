import { Pattern } from '../patterns/Pattern';
import { Enemy } from '../objects/Enemy';
import { Coin } from '../objects/Coin';
import { Trap } from '../objects/Trap';
import { Goal } from '../objects/Goal';

export class LevelGenerator {
  private patterns: Pattern[] = [];
  private currentPatternIndex: number = 0;
  private currentX: number = 800; // Start off-screen
  private playerDistanceTraveled: number = 0; // Track player's actual distance
  private levelCompleted: boolean = false;
  private goalReached: boolean = false;
  private minPatternInterval: number = 1000; // Minimum 1 second between patterns
  private shouldLoopPatterns: boolean = false; // Whether to loop patterns when reaching end

  constructor(patterns: Pattern[], shouldLoopPatterns: boolean = false) {
    this.patterns = patterns;
    this.shouldLoopPatterns = shouldLoopPatterns;
    console.log(`Initialized level generator with ${this.patterns.length} patterns, looping: ${shouldLoopPatterns}`);
  }

  public update(playerDistanceTraveled: number): { enemies: Enemy[], coins: Coin[], traps: Trap[], goals: Goal[] } {
    const result = { enemies: [] as Enemy[], coins: [] as Coin[], traps: [] as Trap[], goals: [] as Goal[] };

    this.playerDistanceTraveled = playerDistanceTraveled;

    if (this.currentPatternIndex >= this.patterns.length) {
      if (this.shouldLoopPatterns) {
        // Reset to beginning for looping patterns (objective-based levels)
        this.currentPatternIndex = 0;
      } else {
        // Mark level completed for goal-based levels
        if (!this.levelCompleted) {
          this.levelCompleted = true;
        }
        return result;
      }
    }

    const generationDistance = 800; 
    if (this.playerDistanceTraveled + generationDistance >= this.currentX) {
      const currentPattern = this.patterns[this.currentPatternIndex];
      if (currentPattern) {
        const relativeX = 800 + 50 + (this.currentX - this.playerDistanceTraveled);
        const objects = currentPattern.createObjects(relativeX);
        
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

  public getTotalPatterns(): number {
    return this.patterns.length;
  }

  public getCurrentProgress(): number {
    return this.patterns.length > 0 ? this.currentPatternIndex / this.patterns.length : 0;
  }
}