import { Pattern, type PatternEntity } from '../objects/Pattern';
import { Goal } from '../objects/Goal';

export class GoalPattern extends Pattern {
  constructor() {
    super('goal');
  }

  public generate(startX: number, groundY: number): PatternEntity[] {
    // The goal will be handled separately in the level system
    // This just marks the end point for pattern generation
    return [{
      type: 'goal', // Use proper goal type
      position: {
        x: startX,
        y: groundY - 300 // High up to make it visible
      },
      size: {
        width: 128,
        height: 256
      },
      collisionBox: {
        collisionOffsetX: 16,
        collisionOffsetY: 16,
        collisionWidth: 96,
        collisionHeight: 224
      }
    }];
  }

  public createObjects(startX: number, groundY: number): any[] {
    const entities = this.generate(startX, groundY);
    return entities.map(entity => {
      return new Goal(
        entity.position,
        entity.size,
        entity.collisionBox
      );
    });
  }
}