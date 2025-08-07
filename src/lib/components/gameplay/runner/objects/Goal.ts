import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../types/GameTypes';

export class Goal extends SpriteAnimationObject {
  public reached: boolean = false;

  public static getSize(): Size {
    return { width: 200, height: 600 }; // Full Y-axis height
  }

  public static getCollisionBox(): CollisionBox {
    return {
      collisionOffsetX: 0,
      collisionOffsetY: 0,
      collisionWidth: 200,
      collisionHeight: 600 // Cover full Y-axis for collision
    };
  }

  constructor(position: Position) {
    super(
      position,
      Goal.getSize(),
      'goal', // Future goal sprite
      1, // Single frame for now
      0,  // No animation
      Goal.getCollisionBox()
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.moveWithScroll(scrollSpeed);
  }

  protected renderFallback(ctx: CanvasRenderingContext2D, groundY?: number): void {
    // Calculate render position with groundY offset
    const renderY = groundY !== undefined ? groundY + this.y : this.y;
    
    // Draw goal flag as fallback
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(this.x, renderY, this.width, this.height);
    
    // Draw flag pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 10, renderY + 10, this.width - 20, this.height - 20);
    
    ctx.fillStyle = '#ff0000';
    ctx.fillText('GOAL', this.x + this.width/4, renderY + this.height/2);
  }

  public reach(): void {
    this.reached = true;
  }
}