import type { Position, Size } from '../GameTypes';
import { Enemy } from '../objects/Enemy';
import { Coin } from '../objects/Coin';
import { Trap } from '../objects/Trap';
import { Goal } from '../objects/Goal';

export interface PatternEntity {
  type: 'enemy' | 'coin' | 'trap' | 'goal';
  position: Position;
}

export abstract class Pattern {
  public name: string;
  public entities: PatternEntity[];

  constructor(name: string) {
    this.name = name;
    this.entities = [];
  }

  // Generate the pattern entities
  public abstract generate(startX: number): PatternEntity[];

  // Create actual game objects from pattern
  public createObjects(startX: number): (Enemy | Coin | Trap | Goal)[] {
    const patternEntities = this.generate(startX);
    const objects: (Enemy | Coin | Trap | Goal)[] = [];

    patternEntities.forEach(entity => {
      switch (entity.type) {
        case 'enemy':
          objects.push(new Enemy(entity.position));
          break;
        case 'coin':
          objects.push(new Coin(entity.position));
          break;
        case 'trap':
          objects.push(new Trap(entity.position));
          break;
        case 'goal':
          objects.push(new Goal(entity.position));
          break;
      }
    });

    return objects;
  }

  // Get total distance covered by this pattern
  public abstract getDistance(): number;
}