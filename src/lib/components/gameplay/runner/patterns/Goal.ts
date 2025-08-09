import { Pattern, type PatternEntity } from './Pattern';
import { Goal } from '../objects/Goal';

export class GoalPattern extends Pattern {
  constructor() {
    super('goal');
  }

  public generate(startX: number): PatternEntity[] {
    // The goal will be handled separately in the level system
    // This just marks the end point for pattern generation
    return [{
      type: 'goal', // Use proper goal type
      position: {
        x: startX,
        y: 0 // Start from top to cover full Y-axis as per requirements
      }
    }];
  }

  public getDistance(): number {
    return Goal.getSize().width; // Just the width of the goal
  }
}