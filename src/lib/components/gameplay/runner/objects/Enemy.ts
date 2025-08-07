import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../types/GameTypes';

export class Enemy extends SpriteAnimationObject {
  public facingLeft: boolean = true;

  // Default size and collision box for enemies
  public static getDefaultSize(): Size {
    return { width: 160, height: 160 };
  }

  public static getDefaultCollisionBox(): CollisionBox {
    return {
      collisionOffsetX: 20,
      collisionOffsetY: 20,
      collisionWidth: 120,
      collisionHeight: 120
    };
  }

  constructor(
    position: Position,
    size?: Size,
    collisionBox?: Partial<CollisionBox>
  ) {
    super(
      position,
      size || Enemy.getDefaultSize(),
      'enemy',
      1, // Single frame for enemy (could be expanded)
      0,  // No animation for basic enemy
      collisionBox || Enemy.getDefaultCollisionBox()
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.moveWithScroll(scrollSpeed);
  }

  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    const image = images[this.spriteSheetKey];
    if (!image) {
      this.renderFallback(ctx);
      return;
    }

    ctx.save();
    if (this.facingLeft) {
      ctx.scale(-1, 1);
      ctx.drawImage(image, -this.x - this.width, this.y, this.width, this.height);
    } else {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
    }
    ctx.restore();
  }

  protected renderFallback(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}