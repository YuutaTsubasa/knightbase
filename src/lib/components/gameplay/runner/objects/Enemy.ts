import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../GameTypes';

export class Enemy extends SpriteAnimationObject {
  public facingLeft: boolean = true;

  public static getSize(): Size {
    return { width: 160, height: 160 };
  }

  public static getCollisionBox(): CollisionBox {
    return {
      collisionOffsetX: 20,
      collisionOffsetY: 20,
      collisionWidth: 120,
      collisionHeight: 120
    };
  }

  constructor(position: Position) {
    super(
      position,
      Enemy.getSize(),
      'enemy',
      1, // Single frame for enemy (could be expanded)
      0,  // No animation for basic enemy
      Enemy.getCollisionBox()
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.moveWithScroll(scrollSpeed);
  }

  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, renderGroundY?: number): void {
    const image = images[this.spriteSheetKey];
    if (!image) {
      this.renderFallback(ctx, renderGroundY);
      return;
    }

    // Calculate render position using proper coordinate system conversion
    const renderY = renderGroundY !== undefined
      ? renderGroundY - this.height
      : this.y;

    ctx.save();
    if (this.facingLeft) {
      ctx.scale(-1, 1);
      ctx.drawImage(image, -this.x - this.width, renderY, this.width, this.height);
    } else {
      ctx.drawImage(image, this.x, renderY, this.width, this.height);
    }
    ctx.restore();
  }

  protected renderFallback(ctx: CanvasRenderingContext2D, renderGroundY?: number): void {
    const renderY = renderGroundY !== undefined
      ? renderGroundY - this.y - this.height
      : this.y;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x, renderY, this.width, this.height);
  }
}