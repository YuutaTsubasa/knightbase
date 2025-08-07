import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../types/GameTypes';

export class Trap extends SpriteAnimationObject {
  
  // Default size and collision box for traps
  public static getDefaultSize(): Size {
    return { width: 200, height: 80 };
  }

  public static getDefaultCollisionBox(): CollisionBox {
    return {
      collisionOffsetX: 10,
      collisionOffsetY: 10,
      collisionWidth: 180,
      collisionHeight: 60
    };
  }

  constructor(
    position: Position,
    size?: Size,
    collisionBox?: Partial<CollisionBox>
  ) {
    super(
      position,
      size || Trap.getDefaultSize(),
      'trap',
      1, // Single frame for trap
      0,  // No animation for trap
      collisionBox || Trap.getDefaultCollisionBox()
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