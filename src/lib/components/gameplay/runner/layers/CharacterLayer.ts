import { Layer } from './Layer';
import { Player } from '../objects/Player';
import { Projectile } from '../objects/Projectile';

export class CharacterLayer extends Layer {
  private player: Player | null = null;

  constructor() {
    super('character');
  }

  public setPlayer(player: Player): void {
    this.player = player;
  }

  public getPlayer(): Player | null {
    return this.player;
  }

  protected updateLayer(deltaTime: number, scrollSpeed: number): void {
    // Update player separately from entities
    if (this.player) {
      this.player.update(deltaTime, scrollSpeed);
    }
  }

  protected preRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // No pre-render needed
  }

  protected postRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // Render player after projectiles
    if (this.player) {
      this.player.render(ctx, images);
    }
  }

  public renderPlayerWithInvincibility(
    ctx: CanvasRenderingContext2D, 
    images: Record<string, HTMLImageElement>,
    isInvincible: boolean,
    invincibleTimer: number
  ): void {
    if (this.player) {
      this.player.renderWithInvincibility(ctx, images, isInvincible, invincibleTimer);
    }
  }

  // Override render to handle player separately
  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // Render projectiles first
    this.entities.forEach(entity => entity.render(ctx, images));
    
    // Player rendering is handled separately via renderPlayerWithInvincibility
  }

  public addProjectile(projectile: Projectile): void {
    this.addEntity(projectile);
  }

  public getProjectiles(): Projectile[] {
    return this.entities.filter(entity => entity instanceof Projectile) as Projectile[];
  }
}