import { Pattern, type PatternEntity } from './Pattern';
import { Coin } from '../objects/Coin';

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

  public generate(startX: number): PatternEntity[] {
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
          y: this.startY + arcY // Positive Y above ground
        }
      });
    }

    return entities;
  }

  public getDistance(): number {
    return this.arcWidth + Coin.getSize().width; // Width of arc plus coin width for spacing
  }
}