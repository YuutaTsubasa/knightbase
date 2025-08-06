import { Pattern, type PatternEntity } from '../objects/Pattern';

export class TrapComboPattern extends Pattern {
  private trapCount: number;
  private spacing: number;

  constructor(trapCount: number = 3, spacing: number = 150) {
    super('trapCombo');
    this.trapCount = trapCount;
    this.spacing = spacing;
  }

  public generate(startX: number, groundY: number): PatternEntity[] {
    const entities: PatternEntity[] = [];

    for (let i = 0; i < this.trapCount; i++) {
      entities.push({
        type: 'trap',
        position: {
          x: startX + i * this.spacing,
          y: groundY - 96
        },
        size: {
          width: 128,
          height: 96
        },
        collisionBox: {
          collisionOffsetX: 16,
          collisionOffsetY: 8,
          collisionWidth: 96,
          collisionHeight: 32
        }
      });
    }

    return entities;
  }
}