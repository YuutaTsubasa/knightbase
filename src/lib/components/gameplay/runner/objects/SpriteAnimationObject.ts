import { Object } from './Object';
import type { Position, Size, CollisionBox, AnimatedEntity } from '../GameTypes';
import { getRenderY } from '../Utils';

export abstract class SpriteAnimationObject extends Object implements AnimatedEntity {
  public animationFrame: number = 0;
  public animationTimer: number = 0;
  public animation: string = 'default';
  
  protected animationSpeed: number;
  protected totalFrames: number;
  protected spriteSheetKey: string;

  constructor(
    position: Position,
    size: Size,
    spriteSheetKey: string,
    totalFrames: number = 6,
    animationSpeed: number = 100,
    collisionBox?: Partial<CollisionBox>
  ) {
    super(position, size, collisionBox);
    this.spriteSheetKey = spriteSheetKey;
    this.totalFrames = totalFrames;
    this.animationSpeed = animationSpeed;
  }

  // Update animation frames
  protected updateAnimation(deltaTime: number): void {
    this.animationTimer += deltaTime;
    if (this.animationTimer > this.animationSpeed) {
      this.animationFrame = (this.animationFrame + 1) % this.totalFrames;
      this.animationTimer = 0;
      this.onAnimationFrameChange();
    }
  }

  // Hook for subclasses to react to frame changes (e.g., sound effects)
  protected onAnimationFrameChange(): void {
    // Override in subclasses if needed
  }

  // Render sprite with animation frame
  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, groundY?: number): void {
    const image = images[this.spriteSheetKey];
    if (!image) {
      this.renderFallback(ctx, groundY);
      return;
    }

    // Calculate frame position in sprite sheet
    const frameWidth = image.width / this.totalFrames;
    const frameHeight = image.height;
    const frameX = this.animationFrame * frameWidth;

    // Calculate render position using proper coordinate system conversion
    const renderY = groundY !== undefined 
      ? getRenderY(ctx.canvas.height, groundY, this.y) - this.height
      : this.y;

    // Draw the specific frame
    ctx.drawImage(
      image,
      frameX, 0, frameWidth, frameHeight,  // Source rectangle (sprite frame)
      this.x, renderY, this.width, this.height  // Destination rectangle
    );
  }

  // Render sprite with flipping support
  protected renderFlipped(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, facingLeft: boolean, groundY?: number): void {
    const image = images[this.spriteSheetKey];
    if (!image) {
      this.renderFallback(ctx, groundY);
      return;
    }

    // Calculate render position using proper coordinate system conversion
    const renderY = groundY !== undefined 
      ? getRenderY(ctx.canvas.height, groundY, this.y) - this.height
      : this.y;

    ctx.save();
    if (facingLeft) {
      ctx.scale(-1, 1);
      ctx.drawImage(image, -this.x - this.width, renderY, this.width, this.height);
    } else {
      ctx.drawImage(image, this.x, renderY, this.width, this.height);
    }
    ctx.restore();
  }

  // Fallback rendering for when image is not loaded
  protected abstract renderFallback(ctx: CanvasRenderingContext2D, groundY?: number): void;

  // Set animation state
  public setAnimation(animation: string): void {
    if (this.animation !== animation) {
      this.animation = animation;
      this.animationFrame = 0;
      this.animationTimer = 0;
    }
  }
}