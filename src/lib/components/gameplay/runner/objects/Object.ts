import type { Position, Size, CollisionBox, GameEntity } from '../GameTypes';

export abstract class Object implements GameEntity {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public collisionOffsetX: number;
  public collisionOffsetY: number;
  public collisionWidth: number;
  public collisionHeight: number;

  constructor(
    position: Position,
    size: Size,
    collisionBox?: Partial<CollisionBox>
  ) {
    this.x = position.x;
    this.y = position.y;
    this.width = size.width;
    this.height = size.height;
    
    // Default collision box to match size if not provided
    this.collisionOffsetX = collisionBox?.collisionOffsetX ?? 0;
    this.collisionOffsetY = collisionBox?.collisionOffsetY ?? 0;
    this.collisionWidth = collisionBox?.collisionWidth ?? size.width;
    this.collisionHeight = collisionBox?.collisionHeight ?? size.height;
  }

  // Check collision with another object using collision boxes
  public checkCollision(other: GameEntity): boolean {
    const thisLeft = this.x + this.collisionOffsetX;
    const thisRight = thisLeft + this.collisionWidth;
    const thisTop = this.y + this.collisionOffsetY;
    const thisBottom = thisTop + this.collisionHeight;

    const otherLeft = other.x + other.collisionOffsetX;
    const otherRight = otherLeft + other.collisionWidth;
    const otherTop = other.y + other.collisionOffsetY;
    const otherBottom = otherTop + other.collisionHeight;

    return thisLeft < otherRight && 
           thisRight > otherLeft && 
           thisTop < otherBottom && 
           thisBottom > otherTop;
  }

  // Abstract methods that must be implemented by subclasses
  public abstract update(deltaTime: number, scrollSpeed: number): void;
  public abstract render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, groundY?: number): void;

  // Helper method for basic movement (used by many objects)
  protected moveWithScroll(scrollSpeed: number): void {
    this.x -= scrollSpeed;
  }

  // Check if object is off-screen (for cleanup)
  public isOffScreen(canvasWidth: number): boolean {
    return this.x < -this.width || this.x > canvasWidth + this.width;
  }
}