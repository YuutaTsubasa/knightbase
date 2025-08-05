import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../types/GameTypes';

export class Trap extends SpriteAnimationObject {
  constructor(
    position: Position,
    size: Size,
    collisionBox?: Partial<CollisionBox>
  ) {
    super(
      position,
      size,
      'trap',
      1, // Single frame for trap
      0,  // No animation for trap
      collisionBox
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.moveWithScroll(scrollSpeed);
  }

  protected renderFallback(ctx: CanvasRenderingContext2D): void {
    // Draw trap spikes as fallback
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw spike pattern
    ctx.fillStyle = '#ff0000';
    const spikeCount = 4;
    const spikeWidth = this.width / spikeCount;
    for (let i = 0; i < spikeCount; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + i * spikeWidth, this.y + this.height);
      ctx.lineTo(this.x + i * spikeWidth + spikeWidth/2, this.y);
      ctx.lineTo(this.x + (i + 1) * spikeWidth, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  }
}