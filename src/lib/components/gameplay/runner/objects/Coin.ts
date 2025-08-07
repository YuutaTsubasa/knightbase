import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../types/GameTypes';

export class Coin extends SpriteAnimationObject {
  public collected: boolean = false;

  public static getSize(): Size {
    return { width: 128, height: 128 };
  }

  public static getCollisionBox(): CollisionBox {
    return {
      collisionOffsetX: 16,
      collisionOffsetY: 16,
      collisionWidth: 96,
      collisionHeight: 96
    };
  }

  constructor(position: Position) {
    super(
      position,
      Coin.getSize(),
      'coin',
      1, // Single frame for coin (could be expanded for spinning animation)
      0,  // No animation for basic coin
      Coin.getCollisionBox()
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    if (!this.collected) {
      this.moveWithScroll(scrollSpeed);
    }
  }

  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    if (this.collected) return;
    const image = images[this.spriteSheetKey];
    if (!image) {
      this.renderFallback(ctx);
      return;
    }
    ctx.drawImage(image, this.x, this.y, this.width, this.height);
  }

  protected renderFallback(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, 2 * Math.PI);
    ctx.fill();
  }

  public collect(): void {
    this.collected = true;
  }
}