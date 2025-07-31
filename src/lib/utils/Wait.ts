import type { Readable, Writable } from "svelte/store";

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function waitUntil<T>(
  store: Readable<T>,
  predicate: (value: T) => boolean
): Promise<T> {
  let unsubscribe: () => void;
  return new Promise<T>(resolve => {
    unsubscribe = store.subscribe(value => {
      if (predicate(value)) {
        unsubscribe();
        resolve(value);
      }
    });
  });
}