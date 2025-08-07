import { Pattern } from '../patterns/Pattern';
import { CoinLinePattern } from '../patterns/CoinLine';
import { TrapComboPattern } from '../patterns/TrapCombo';
import { Enemy } from '../objects/Enemy';
import { Coin } from '../objects/Coin';
import { Trap } from '../objects/Trap';
import { Goal } from '../objects/Goal';

export class EndlessGenerator {
  private patterns: Pattern[];
  private lastSpawnTime: number = 0;
  private lastTrapSpawnTime: number = 0;
  private spawnChance: number = 0.0001;
  
  private readonly MIN_TRAP_INTERVAL = 3000;
  private readonly spawnChanceIncreasePerFrame = (1 - 0.0001) / (60 * 25); // 25 seconds to 100% at 60fps

  constructor() {
    this.patterns = [
      new CoinLinePattern(),
      new TrapComboPattern()
    ];
  }

  public update(deltaTime: number): { enemies: Enemy[], coins: Coin[], traps: Trap[], goals: Goal[] } {
    const now = performance.now();
    const result = { enemies: [] as Enemy[], coins: [] as Coin[], traps: [] as Trap[], goals: [] as Goal[] };

    // Increase spawn chance every frame
    this.spawnChance += this.spawnChanceIncreasePerFrame;
    if (this.spawnChance > 1) this.spawnChance = 1;

    const rand = Math.random();
    
    if (rand < this.spawnChance) {
      const typeRand = Math.random();
      
      if (typeRand < 0.4) {
        // Spawn enemy
        result.enemies.push(this.createEnemy());
      } else if (typeRand < 0.75) {
        // Spawn trap (with interval check)
        if (now - this.lastTrapSpawnTime > this.MIN_TRAP_INTERVAL) {
          result.traps.push(this.createTrap());
          this.lastTrapSpawnTime = now;
        }
      } else {
        // Spawn coin
        result.coins.push(this.createCoin());
      }

      // Reset spawn chance
      this.spawnChance = 0.0001;
    }

    return result;
  }

  private createEnemy(): Enemy {
    return new Enemy(
      { x: 800 + 50, y: 0 } // Y position will be adjusted during render
    );
  }

  private createCoin(): Coin {
    return new Coin(
      { 
        x: 800 + 50 + Math.random() * 200, 
        y: -200 - Math.random() * 300  // Relative Y position, will be adjusted during render
      }
    );
  }

  private createTrap(): Trap {
    return new Trap(
      { x: 800 + 50, y: 0 } // Y position will be adjusted during render
    );
  }

  public reset(): void {
    this.spawnChance = 0.0001;
    this.lastSpawnTime = 0;
    this.lastTrapSpawnTime = 0;
  }
}