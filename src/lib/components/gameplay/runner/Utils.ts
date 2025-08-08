// Convert from object coordinate system (Y=0 at ground, positive upward) 
// to canvas coordinate system (Y=0 at top, positive downward)
export function getRenderY(canvasHeight: number, groundY: number, objectY: number): number {
  return (canvasHeight - groundY) - objectY;
}

// Get the render position of the ground in canvas coordinates
export function getRenderGroundY(canvasHeight: number, groundY: number): number {
  return canvasHeight - groundY;
}