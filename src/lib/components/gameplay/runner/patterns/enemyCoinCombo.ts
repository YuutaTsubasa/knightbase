import { Pattern, type PatternEntity } from '../objects/Pattern';

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

  public generate(startX: number, groundY: number): PatternEntity[] {
    const entities: PatternEntity[] = [];
    let currentX = startX;

    // Place enemies first
    for (let i = 0; i < this.enemyCount; i++) {
      entities.push({
        type: 'enemy',
        position: {
          x: currentX,
          y: groundY - 128
        },
        size: {
          width: 128,
          height: 128
        },
        collisionBox: {
          collisionOffsetX: 16,
          collisionOffsetY: 16,
          collisionWidth: 96,
          collisionHeight: 96
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
          y: groundY - 200 - Math.random() * 50 // Higher than usual to reward jumping over enemy
        },
        size: {
          width: 128,
          height: 128
        },
        collisionBox: {
          collisionOffsetX: 16,
          collisionOffsetY: 16,
          collisionWidth: 96,
          collisionHeight: 96
        }
      });
      currentX += this.spacing * 0.8; // Tighter spacing for coins
    }

    return entities;
  }
}