import { wait } from '$lib/utils/Wait';
import type { ITransitionComponent } from './ITransitionComponent';

const INITIAL_SCALE_HEIGHT_BY_GRID = 'initialScaleHeightByGrid';
const ENTER_SCALE_HEIGHT_BY_GRID = 'enterScaleHeightByGrid';
const LEAVE_SCALE_HEIGHT_BY_GRID = 'leaveScaleHeightByGrid';

export class ScaleHeightTransitionComponent implements ITransitionComponent {
  private element: HTMLElement;
  private duration: number;

  constructor(element: HTMLElement, duration: number = 500) {
    let gridElement = document.createElement("div");
    let parentNode = element.parentElement;
    gridElement.appendChild(element);
    parentNode?.appendChild(gridElement);
    this.element = gridElement;
    this.element.classList.add(INITIAL_SCALE_HEIGHT_BY_GRID);
    this.duration = duration;
    this.element.style.setProperty("--duration", `${duration / 1000}s`);
  }

  async enter(): Promise<void> {
    this.element.classList.remove(INITIAL_SCALE_HEIGHT_BY_GRID);
    this.element.classList.remove(LEAVE_SCALE_HEIGHT_BY_GRID);
    this.element.classList.add(ENTER_SCALE_HEIGHT_BY_GRID);
    await wait(this.duration);
  }

  async leave(): Promise<void> {
    this.element.classList.remove(INITIAL_SCALE_HEIGHT_BY_GRID);
    this.element.classList.remove(ENTER_SCALE_HEIGHT_BY_GRID);
    this.element.classList.add(LEAVE_SCALE_HEIGHT_BY_GRID);
    await wait(this.duration);
  }
}