// Game entity position and size interface
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CollisionBox {
  collisionOffsetX: number;
  collisionOffsetY: number;
  collisionWidth: number;
  collisionHeight: number;
}

// Game state enums
export type GameState = 'playing' | 'paused' | 'gameOver';

export type AnimationType = 'run' | 'jump' | 'attack';

// Game settings and constants
export interface GameSettings {
  GRAVITY: number;
  JUMP_FORCE: number;
  GROUND_Y: number;
  BASE_SCROLL_SPEED: number;
  INVINCIBLE_DURATION: number;
  MIN_TRAP_INTERVAL: number;
}

// Entity interfaces
export interface GameEntity extends Position, Size, CollisionBox {
  update(deltaTime: number, scrollSpeed: number): void;
  render(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>, groundY?: number): void;
  isOffScreen(canvasWidth: number): boolean;
}

export interface AnimatedEntity extends GameEntity {
  animationFrame: number;
  animationTimer: number;
  animation?: string;
}

// Game stats
export interface GameStats {
  survivalTime: number;
  coins: number;
  lives: number;
  score: number;
}