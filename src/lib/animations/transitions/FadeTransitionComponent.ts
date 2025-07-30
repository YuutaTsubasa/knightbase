import { wait } from '$lib/utils/Wait';
import type { ITransitionComponent } from './ITransitionComponent';

const INITIAL_FADE_NAME = "initialFade";
const ENTER_FADE_NAME = "enterFade";
const LEAVE_FADE_NAME = "leaveFade";

export class FadeTransitionComponent implements ITransitionComponent {
  private element: HTMLElement;
  private duration: number;

  constructor(element: HTMLElement, duration: number = 500) {
    this.element = element;
    this.element.classList.add(INITIAL_FADE_NAME);
    this.duration = duration;
    this.element.style.setProperty("--duration", `${duration / 1000}s`);
  }

  async enter(): Promise<void> {
    this.element.classList.remove(INITIAL_FADE_NAME);
    this.element.classList.remove(LEAVE_FADE_NAME);
    this.element.classList.add(ENTER_FADE_NAME);
    await wait(this.duration);
  }

  async leave(): Promise<void> {
    this.element.classList.remove(INITIAL_FADE_NAME);
    this.element.classList.remove(ENTER_FADE_NAME);
    this.element.classList.add(LEAVE_FADE_NAME);
    await wait(this.duration);
  }
}