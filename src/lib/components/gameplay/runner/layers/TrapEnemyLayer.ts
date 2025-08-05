import { Layer } from './Layer';
import { Enemy } from '../objects/Enemy';
import { Trap } from '../objects/Trap';
import { Coin } from '../objects/Coin';

export class TrapEnemyLayer extends Layer {
  constructor() {
    super('trap-enemy');
  }

  protected updateLayer(deltaTime: number, scrollSpeed: number): void {
    // No additional layer-specific update needed
  }

  protected preRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // No pre-render needed
  }

  protected postRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // No post-render needed
  }

  public addEnemy(enemy: Enemy): void {
    this.addEntity(enemy);
  }

  public addTrap(trap: Trap): void {
    this.addEntity(trap);
  }

  public addCoin(coin: Coin): void {
    this.addEntity(coin);
  }

  public getEnemies(): Enemy[] {
    return this.entities.filter(entity => entity instanceof Enemy) as Enemy[];
  }

  public getTraps(): Trap[] {
    return this.entities.filter(entity => entity instanceof Trap) as Trap[];
  }

  public getCoins(): Coin[] {
    return this.entities.filter(entity => entity instanceof Coin) as Coin[];
  }

  // Remove collected coins
  public removeCollectedCoins(): void {
    this.entities = this.entities.filter(entity => {
      if (entity instanceof Coin) {
        return !entity.collected;
      }
      return true;
    });
  }
}