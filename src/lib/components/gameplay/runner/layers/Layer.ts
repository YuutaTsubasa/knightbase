import type { GameEntity } from '../types/GameTypes';

export class Layer {
  protected entities: GameEntity[] = [];
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  // Add entity to this layer
  public addEntity(entity: GameEntity): void {
    this.entities.push(entity);
  }

  // Remove entity from this layer
  public removeEntity(entity: GameEntity): void {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  // Remove entities based on condition
  public removeEntitiesWhere(predicate: (entity: GameEntity) => boolean): GameEntity[] {
    const toRemove = this.entities.filter(predicate);
    this.entities = this.entities.filter(entity => !predicate(entity));
    return toRemove;
  }

  // Get all entities in this layer
  public getEntities(): GameEntity[] {
    return [...this.entities];
  }

  // Clear all entities
  public clear(): void {
    this.entities = [];
  }

  // Update all entities in this layer
  public update(deltaTime: number, scrollSpeed: number): void {
    this.entities.forEach(entity => entity.update(deltaTime, scrollSpeed));
    
    // Remove off-screen entities
    this.entities = this.entities.filter(entity => !entity.isOffScreen(800)); // Canvas width
  }

  // Render all entities in this layer
  public render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, groundY?: number): void {
    // Render all entities
    this.entities.forEach(entity => entity.render(ctx, images, groundY));
  }
}