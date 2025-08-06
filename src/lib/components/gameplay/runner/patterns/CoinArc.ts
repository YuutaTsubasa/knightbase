import { Pattern, type PatternEntity } from '../objects/Pattern';

export class CoinArcPattern extends Pattern {
  private coinCount: number;
  private arcHeight: number;
  private arcWidth: number;
  private startY: number;

  constructor(coinCount: number = 5, arcHeight: number = 200, arcWidth: number = 400, startY: number = 300) {
    super('coinArc');
    this.coinCount = coinCount;
    this.arcHeight = arcHeight;
    this.arcWidth = arcWidth;
    this.startY = startY;
  }

  public generate(startX: number, groundY: number): PatternEntity[] {
    const entities: PatternEntity[] = [];
    const stepX = this.arcWidth / Math.max(1, this.coinCount - 1);

    for (let i = 0; i < this.coinCount; i++) {
      // Create arc shape using cosine function
      const progress = i / Math.max(1, this.coinCount - 1);
      const angle = Math.PI * progress; // 0 to PI for half circle
      const arcY = Math.sin(angle) * this.arcHeight;
      
      entities.push({
        type: 'coin',
        position: {
          x: startX + i * stepX,
          y: groundY - this.startY - arcY
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