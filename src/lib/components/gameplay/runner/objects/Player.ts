import { SpriteAnimationObject } from './SpriteAnimationObject';
import { Projectile } from './Projectile';
import type { Position, Size, CollisionBox, AnimationType } from '../types/GameTypes';
import { AudioManager } from '$lib/systems/AudioManager';
import { characterAttackAudioKey, characterAttackImageKey, characterJumpImageKey, characterRunImageKey, characterWalkAudioKey } from '$lib/utils/KeyHelper';

export class Player extends SpriteAnimationObject {
  public velocityY: number = 0;
  public onGround: boolean = true;
  public animation: AnimationType = 'run';
  
  private groundY: number;
  private gravity: number;
  private jumpForce: number;
  private characterKey: string;

  constructor(
    position: Position,
    size: Size,
    groundY: number,
    characterKey: string,
    gravity: number = 0.8,
    jumpForce: number = -20,
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
    
    this.groundY = groundY;
    this.gravity = gravity;
    this.jumpForce = jumpForce;
    this.characterKey = characterKey;
  }

  public update(deltaTime: number, scrollSpeed: number): void {
    // Apply gravity
    this.velocityY += this.gravity;
    this.y += this.velocityY;

    // Ground collision
    if (this.y >= this.groundY - this.height) {
      this.y = this.groundY - this.height;
      this.velocityY = 0;
      this.onGround = true;
      if (this.animation === 'jump') {
        this.setAnimation('run');
      }
    }

    // Update animation based on current state
    this.updateAnimationState();
    this.updateAnimation(deltaTime);
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

  protected renderFallback(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Render with invincibility flashing
  public renderWithInvincibility(
    ctx: CanvasRenderingContext2D, 
    images: Record<string, HTMLImageElement>,
    isInvincible: boolean,
    invincibleTimer: number
  ): void {
    if (!isInvincible) {
      this.render(ctx, images);
      return;
    }

    // Flash every 100ms during invincibility
    const shouldDraw = Math.floor(invincibleTimer / 100) % 2 === 0;
    if (shouldDraw) {
      this.render(ctx, images);
    }
  }
}