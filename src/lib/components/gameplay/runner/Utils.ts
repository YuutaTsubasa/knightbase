// Get the render position of the ground in canvas coordinates
export function getRenderGroundY(canvasHeight: number, groundY: number): number {
  return canvasHeight - groundY;
}