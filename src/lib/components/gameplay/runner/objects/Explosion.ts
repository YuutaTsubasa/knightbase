import { SpriteAnimationObject } from './SpriteAnimationObject';
import { AudioManager } from '$lib/systems/AudioManager';
import type { Position, Size } from '../GameTypes';

export class Explosion extends SpriteAnimationObject {
  public finished: boolean = false;
  private soundPlayed: boolean = false;

  constructor(
    position: Position,
    size: Size
  ) {
    super(
      position,
      size,
      'explosion',
      6, // 6 frames for explosion animation
      100 // Animation speed
    );
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.moveWithScroll(scrollSpeed);
    this.updateAnimation(deltaTime);
    
    // Play explosion sound on first update (once)
    if (!this.soundPlayed) {
      AudioManager.play("sfx_explosion");
      this.soundPlayed = true;
    }
  }

  protected onAnimationFrameChange(): void {
    // Mark as finished when animation completes
    if (this.animationFrame >= this.totalFrames - 1) {
      this.finished = true;
    }
  }

  protected renderFallback(ctx: CanvasRenderingContext2D, renderGroundY?: number): void {
    if (this.finished) return;
    
    // Calculate render position using proper coordinate system conversion
    const renderY = renderGroundY !== undefined
      ? renderGroundY - this.y - this.height
      : this.y;

    // Simple expanding circle as fallback
    const radius = (this.animationFrame / this.totalFrames) * this.width / 2;
    ctx.fillStyle = `rgba(255, ${255 - this.animationFrame * 40}, 0, ${1 - this.animationFrame / this.totalFrames})`;
    ctx.beginPath();
    ctx.arc(this.x + this.width/2, renderY + this.height/2, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}