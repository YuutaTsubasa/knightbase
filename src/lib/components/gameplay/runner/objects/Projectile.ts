import { SpriteAnimationObject } from './SpriteAnimationObject';
import type { Position, Size } from '../GameTypes';
import { characterAttackEffectImageKey } from '$lib/utils/KeyHelper';

export class Projectile extends SpriteAnimationObject {
  public velocityX: number = 8;
  private characterKey: string;

  constructor(position: Position, size: Size, characterKey: string) {
    super(
      position,
      size,
      characterAttackEffectImageKey(characterKey),
      1, // Single frame for projectile
      0   // No animation
    );
    this.characterKey = characterKey;
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    this.x += this.velocityX;
  }

  protected renderFallback(ctx: CanvasRenderingContext2D, groundY?: number): void {
    const renderY = groundY !== undefined ? groundY + this.y : this.y;
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(this.x, renderY, this.width, this.height);
  }
}