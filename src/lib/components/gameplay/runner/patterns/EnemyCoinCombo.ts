import { Pattern, type PatternEntity } from './Pattern';
import { Enemy } from '../objects/Enemy';
import { Coin } from '../objects/Coin';

export class EnemyCoinComboPattern extends Pattern {
  private enemyCount: number;
  private coinCount: number;
  private spacing: number;

  constructor(enemyCount: number = 1, coinCount: number = 3, spacing: number = 150) {
    super('enemyCoinCombo');
    this.enemyCount = enemyCount;
    this.coinCount = coinCount;
    this.spacing = spacing;
  }

  public generate(startX: number): PatternEntity[] {
    const entities: PatternEntity[] = [];
    let currentX = startX;

    // Place enemies first
    for (let i = 0; i < this.enemyCount; i++) {
      entities.push({
        type: 'enemy',
        position: {
          x: currentX,
          y: 0 // Y=0 at ground level
        }
      });
      currentX += this.spacing;
    }

    // Then place coins after enemies
    for (let i = 0; i < this.coinCount; i++) {
      entities.push({
        type: 'coin',
        position: {
          x: currentX,
          y: 200 + Math.random() * 50 // Positive Y above ground to reward jumping
        }
      });
      currentX += this.spacing * 0.8; // Tighter spacing for coins
    }

    return entities;
  }

  public getDistance(): number {
    const enemyDistance = this.enemyCount * this.spacing;
    const coinDistance = this.coinCount * this.spacing * 0.8;
    return enemyDistance + coinDistance;
  }
}