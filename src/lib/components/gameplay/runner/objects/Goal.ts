import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../types/GameTypes';

export class Goal extends SpriteAnimationObject {
  public reached: boolean = false;

  constructor(
    position: Position,
    size: Size,
    collisionBox?: Partial<CollisionBox>
  ) {
    super(
      position,
      size,
      'goal', // Future goal sprite
      1, // Single frame for now
      0,  // No animation
      collisionBox
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.moveWithScroll(scrollSpeed);
  }

  protected renderFallback(ctx: CanvasRenderingContext2D): void {
    // Draw goal flag as fallback
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw flag pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
    
    ctx.fillStyle = '#ff0000';
    ctx.fillText('GOAL', this.x + this.width/4, this.y + this.height/2);
  }

  public reach(): void {
    this.reached = true;
  }
}