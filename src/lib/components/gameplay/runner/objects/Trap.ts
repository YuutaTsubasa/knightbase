import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../types/GameTypes';

export class Trap extends SpriteAnimationObject {
  
  public static getSize(): Size {
    return { width: 200, height: 80 };
  }

  public static getCollisionBox(): CollisionBox {
    return {
      collisionOffsetX: 10,
      collisionOffsetY: 10,
      collisionWidth: 180,
      collisionHeight: 60
    };
  }

  constructor(position: Position) {
    super(
      position,
      Trap.getSize(),
      'trap',
      1, // Single frame for trap
      0,  // No animation for trap
      Trap.getCollisionBox()
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.moveWithScroll(scrollSpeed);
  }

  protected renderFallback(ctx: CanvasRenderingContext2D, groundY?: number): void {
    // Calculate render position with groundY offset
    const renderY = groundY !== undefined ? groundY + this.y : this.y;
    
    // Draw trap spikes as fallback
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(this.x, renderY, this.width, this.height);
    
    // Draw spike pattern
    ctx.fillStyle = '#ff0000';
    const spikeCount = 4;
    const spikeWidth = this.width / spikeCount;
    for (let i = 0; i < spikeCount; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + i * spikeWidth, renderY + this.height);
      ctx.lineTo(this.x + i * spikeWidth + spikeWidth/2, renderY);
      ctx.lineTo(this.x + (i + 1) * spikeWidth, renderY + this.height);
      ctx.closePath();
      ctx.fill();
    }
  }
}