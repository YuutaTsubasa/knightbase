import type { Position, Size } from '../types/GameTypes';
import { Enemy } from '../objects/Enemy';
import { Coin } from '../objects/Coin';
import { Trap } from '../objects/Trap';

export interface PatternEntity {
  type: 'enemy' | 'coin' | 'trap';
  position: Position;
  size: Size;
  collisionBox?: {
    collisionOffsetX: number;
    collisionOffsetY: number;
    collisionWidth: number;
    collisionHeight: number;
  };
}

export abstract class Pattern {
  public name: string;
  public entities: PatternEntity[];

  constructor(name: string) {
    this.name = name;
    this.entities = [];
  }

  // Generate the pattern entities
  public abstract generate(startX: number, groundY: number): PatternEntity[];

  // Create actual game objects from pattern
  public createObjects(startX: number, groundY: number): (Enemy | Coin | Trap)[] {
    const patternEntities = this.generate(startX, groundY);
    const objects: (Enemy | Coin | Trap)[] = [];

    patternEntities.forEach(entity => {
      switch (entity.type) {
        case 'enemy':
          objects.push(new Enemy(entity.position, entity.size, entity.collisionBox));
          break;
        case 'coin':
          objects.push(new Coin(entity.position, entity.size, entity.collisionBox));
          break;
        case 'trap':
          objects.push(new Trap(entity.position, entity.size, entity.collisionBox));
          break;
      }
    });

    return objects;
  }
}