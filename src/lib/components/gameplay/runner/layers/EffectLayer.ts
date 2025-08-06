import { Layer } from './Layer';
import { Explosion } from '../objects/Explosion';

export class EffectLayer extends Layer {
  constructor() {
    super('effects');
  }

  protected updateLayer(deltaTime: number, scrollSpeed: number): void {
    // Remove finished explosions
    this.entities = this.entities.filter(entity => {
      if (entity instanceof Explosion) {
        return !entity.finished;
      }
      return true;
    });
  }

  protected preRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // No pre-render needed
  }

  protected postRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // No post-render needed
  }

  public addExplosion(explosion: Explosion): void {
    this.addEntity(explosion);
  }

  public getExplosions(): Explosion[] {
    return this.entities.filter(entity => entity instanceof Explosion) as Explosion[];
  }
}