import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isPortrait = writable(false);

if (browser) {
  const updateOrientation = () => {
    isPortrait.set(window.innerHeight > window.innerWidth);
  };
  updateOrientation();
  window.addEventListener('resize', updateOrientation);
}