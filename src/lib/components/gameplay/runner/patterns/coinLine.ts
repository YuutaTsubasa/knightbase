import { Pattern, type PatternEntity } from '../objects/Pattern';

export class CoinLinePattern extends Pattern {
  private coinCount: number;
  private spacing: number;
  private height: number;

  constructor(coinCount: number = 5, spacing: number = 80, height: number = 200) {
    super('coinLine');
    this.coinCount = coinCount;
    this.spacing = spacing;
    this.height = height;
  }

  public generate(startX: number, groundY: number): PatternEntity[] {
    const entities: PatternEntity[] = [];

    for (let i = 0; i < this.coinCount; i++) {
      entities.push({
        type: 'coin',
        position: {
          x: startX + i * this.spacing,
          y: groundY - this.height - Math.random() * 100 // Slight height variation
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
    }

    return entities;
  }
}