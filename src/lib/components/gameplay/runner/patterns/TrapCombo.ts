import { Pattern, type PatternEntity } from '../objects/Pattern';
import { Trap } from '../objects/Trap';

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
          y: groundY - Trap.getDefaultSize().height
        },
        size: Trap.getDefaultSize(),
        collisionBox: Trap.getDefaultCollisionBox()
      });
    }

    return entities;
  }

  public getDistance(): number {
    return (this.trapCount - 1) * this.spacing + Trap.getDefaultSize().width;
  }
}