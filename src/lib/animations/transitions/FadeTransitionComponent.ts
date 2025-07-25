import { wait } from '$lib/utils/Wait';
import type { ITransitionComponent } from './ITransitionComponent';

export class FadeTransitionComponent implements ITransitionComponent {
  protected element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  async enter(): Promise<void> {
    this.element.classList.remove('leaveFade');
    this.element.classList.add('enterFade');
    await wait(500);
  }

  async leave(): Promise<void> {
    this.element.classList.remove('enterFade');
    this.element.classList.add('leaveFade');
    await wait(500);
  }
}