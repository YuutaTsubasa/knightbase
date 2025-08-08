import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size, CollisionBox } from '../GameTypes';
import { getRenderY } from '../Utils';

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

  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, groundY?: number): void {
    const image = images[this.spriteSheetKey];
    if (!image) {
      this.renderFallback(ctx, groundY);
      return;
    }
    
    // Calculate render position using proper coordinate system conversion
    const renderY = groundY !== undefined 
      ? getRenderY(ctx.canvas.height, groundY, this.y) - this.height
      : this.y;
    ctx.drawImage(image, this.x, renderY, this.width, this.height);
  }

  protected renderFallback(ctx: CanvasRenderingContext2D, groundY?: number): void {
    // Calculate render position using proper coordinate system conversion
    const renderY = groundY !== undefined 
      ? getRenderY(ctx.canvas.height, groundY, this.y) - this.height
      : this.y;

    // Draw goal flag as fallback
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(this.x, renderY, this.width, this.height);
    
    // Draw flag pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 10, renderY + 10, this.width - 20, this.height - 20);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = '24px Arial';
    ctx.fillText('GOAL', this.x + this.width/4, renderY + this.height/2);
  }

  public reach(): void {
    this.reached = true;
  }
}