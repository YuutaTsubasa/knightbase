import { writable, get, type Writable, type Subscriber, type Unsubscriber } from "svelte/store";

export class ReactiveProperty<T> {
  private store: Writable<T>;
  
  constructor(initial: T) {
    this.store = writable(initial);
  }

  get value() {
    return get(this.store);
  }

  set value(newValue: T) {
    this.store.set(newValue);
  }

  subscribe(run: (value: T) => void, invalidate?: (value?: T) => void) {
    return this.store.subscribe(run, invalidate);
  }

  async waitUntil(predicate: (value: T) => boolean): Promise<T> {
    return new Promise<T>((resolve) => {
      const unsub = this.store.subscribe((value) => {
        if (predicate(value)) {
          unsub();
          resolve(value);
        }
      });
    });
  }
}