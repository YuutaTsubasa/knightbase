import { Pattern, type PatternEntity } from './Pattern';
import { Coin } from '../objects/Coin';

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

  public generate(startX: number): PatternEntity[] {
    const entities: PatternEntity[] = [];

    for (let i = 0; i < this.coinCount; i++) {
      entities.push({
        type: 'coin',
        position: {
          x: startX + i * this.spacing,
          y: this.height + Math.random() * 100 // Positive Y above ground (height + random)
        }
      });
    }

    return entities;
  }

  public getDistance(): number {
    return (this.coinCount - 1) * this.spacing + Coin.getSize().width;
  }
}