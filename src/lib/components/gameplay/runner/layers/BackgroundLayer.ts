import { Layer } from './Layer';

export class BackgroundLayer extends Layer {
  private backgroundOffset: number = 0;
  private stageGroundOffsetY: number;
  private stageKey: string;

  constructor(stageKey: string, stageGroundOffsetY: number = 0) {
    super('background');
    this.stageKey = stageKey;
    this.stageGroundOffsetY = stageGroundOffsetY;
  }

  protected updateLayer(deltaTime: number, scrollSpeed: number): void {
    // Update background scrolling
    this.backgroundOffset -= scrollSpeed;
  }

  protected preRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw scrolling background
    this.renderBackground(ctx, images);
  }

  protected postRender(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    // No post-render needed for background
  }

  private renderBackground(ctx: CanvasRenderingContext2D, images: Record<string, HTMLImageElement>): void {
    const backgroundImage = images[`stage_background_${this.stageKey}`];
    
    if (backgroundImage) {
      const bgWidth = ctx.canvas.width;
      const bgHeight = ctx.canvas.height;
      
      // Background moved down, need to fill the top and draw extended background
      const backgroundYOffset = bgHeight + this.stageGroundOffsetY;
      const extendedHeight = bgHeight + backgroundYOffset;

      const bgX1 = this.backgroundOffset % bgWidth;
      const bgX2 = bgX1 + bgWidth;
      
      // Draw background pattern to fill entire extended area
      for (let y = -backgroundYOffset; y < extendedHeight; y += bgHeight) {
        ctx.drawImage(backgroundImage, bgX1, y, bgWidth, bgHeight);
        ctx.drawImage(backgroundImage, bgX2, y, bgWidth, bgHeight);
      }
    } else {
      // Fallback background
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#8b5a3c';
      ctx.fillRect(0, 480, ctx.canvas.width, ctx.canvas.height - 480); // GROUND_Y
    }
  }

  public setStage(stageKey: string, stageGroundOffsetY: number = 0): void {
    this.stageKey = stageKey;
    this.stageGroundOffsetY = stageGroundOffsetY;
  }
}