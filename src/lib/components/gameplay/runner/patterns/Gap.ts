import { Pattern, type PatternEntity } from './Pattern';

export class GapPattern extends Pattern {
  private distance: number;

  constructor(distance: number = 200) {
    super('gap');
    this.distance = distance;
  }

  public generate(startX: number, groundY: number): PatternEntity[] {
    // Gap pattern doesn't generate any entities, just provides spacing
    return [];
  }

  public getDistance(): number {
    return this.distance;
  }
}