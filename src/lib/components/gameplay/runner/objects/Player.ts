import { SpriteAnimationObject } from './SpriteAnimationObject';
import { Projectile } from './Projectile';
import type { Position, Size, CollisionBox, AnimationType } from '../GameTypes';
import { AudioManager } from '$lib/systems/AudioManager';
import { characterAttackAudioKey, characterAttackImageKey, characterJumpImageKey, characterRunImageKey, characterWalkAudioKey } from '$lib/utils/KeyHelper';
import { getRenderY } from '../Utils';

export class Player extends SpriteAnimationObject {
  public velocityY: number = 0;
  public onGround: boolean = true;
  public animation: AnimationType = 'run';
  
  // Encapsulated invincibility state
  public isInvincible: boolean = false;
  public invincibleTimer: number = 0;
  
  private gravity: number;
  private jumpForce: number;
  private characterKey: string;
  private invincibleDuration: number;

  constructor(
    position: Position,
    size: Size,
    characterKey: string,
    gravity: number = -0.8,
    jumpForce: number = 20,
    invincibleDuration: number = 2000,
    collisionBox?: Partial<CollisionBox>
  ) {
    // Call parent with run animation initially
    super(
      position, 
      size, 
      characterRunImageKey(characterKey), 
      6, // totalFrames
      100, // animationSpeed
      collisionBox
    );
    
    this.gravity = gravity;
    this.jumpForce = jumpForce;
    this.characterKey = characterKey;
    this.invincibleDuration = invincibleDuration;
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    // Apply gravity
    this.velocityY += this.gravity;
    this.y += this.velocityY;

    // Ground collision
    if (this.y < 0) {
      this.y = 0;
      this.velocityY = 0;
      this.onGround = true;
      if (this.animation === 'jump') {
        this.setAnimation('run');
      }
    }

    // Update animation based on current state
    this.updateAnimationState();
    this.updateAnimation(deltaTime);

    // Update invincibility timer
    if (this.isInvincible) {
      this.invincibleTimer -= deltaTime;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.invincibleTimer = 0;
      }
    }
  }

  private updateAnimationState(): void {
    // Update sprite sheet key based on current animation
    let newSpriteKey = '';
    switch (this.animation) {
      case 'run':
        newSpriteKey = characterRunImageKey(this.characterKey);
        this.animationSpeed = 100;
        break;
      case 'jump':
        newSpriteKey = characterJumpImageKey(this.characterKey);
        this.animationSpeed = 100;
        break;
      case 'attack':
        newSpriteKey = characterAttackImageKey(this.characterKey);
        this.animationSpeed = 150; // Slower for attack animation
        break;
    }
    
    if (this.spriteSheetKey !== newSpriteKey) {
      this.spriteSheetKey = newSpriteKey;
    }
  }

  protected onAnimationFrameChange(): void {
    // Play walk audio on specific frames for run and attack animations
    if ((this.animation === 'run' || this.animation === 'attack') && 
        (this.animationFrame === 0 || this.animationFrame === 3)) {
      AudioManager.play(characterWalkAudioKey(this.characterKey));
    } else if (this.animation === 'jump' && 
               (this.animationFrame === 0 || this.animationFrame === 5)) {
      AudioManager.play(characterWalkAudioKey(this.characterKey));
    }

    // Return to previous animation when attack completes
    if (this.animation === 'attack' && this.animationFrame === 0) {
      this.setAnimation(this.onGround ? 'run' : 'jump');
    }
  }

  public jump(): void {
    if (this.onGround) {
      this.velocityY = this.jumpForce;
      this.onGround = false;
      this.setAnimation('jump');
    }
  }

  public attack(): Projectile | null {
    if (this.animation !== 'attack') {
      this.setAnimation('attack');
      
      // Play attack audio
      AudioManager.play(characterAttackAudioKey(this.characterKey));

      // Create projectile
      return new Projectile(
        { x: this.x + this.width / 2, y: this.y },
        { width: 128, height: 256 },
        this.characterKey
      );
    }
    return null;
  }

  protected renderFallback(ctx: CanvasRenderingContext2D, groundY?: number): void {
    const renderY = getRenderY(ctx.canvas.height, groundY !== undefined ? groundY + this.y : this.y);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(this.x, renderY, this.width, this.height);
  }

  // Render with invincibility flashing
  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, groundY?: number): void {
    if (!this.isInvincible) {
      super.render(ctx, images, groundY);
      return;
    }

    // Flash every 100ms during invincibility
    const shouldDraw = Math.floor(this.invincibleTimer / 100) % 2 === 0;
    if (shouldDraw) {
      super.render(ctx, images, groundY);
    }
  }

  // Method to take damage
  public takeDamage(): boolean {
    if (this.isInvincible) {
      return false; // No damage taken due to invincibility
    }
    
    // Play hurt sound effect
    AudioManager.play("sfx_hurt");
    
    this.isInvincible = true;
    this.invincibleTimer = this.invincibleDuration;
    return true; // Damage taken
  }

  // Legacy method for compatibility (can be removed once all usage is updated)
  public renderWithInvincibility(
    ctx: CanvasRenderingContext2D, 
    images: Record<string, HTMLImageElement>,
    isInvincible: boolean,
    invincibleTimer: number
  ): void {
    // For compatibility, just render normally (invincibility is now internal)
    this.render(ctx, images);
  }
}