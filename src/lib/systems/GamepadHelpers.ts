import { GamepadManager, type FocusableElement } from './GamepadManager';
import { onMount, onDestroy } from 'svelte';

/**
 * Utility function to easily register elements for gamepad navigation
 * @param elements Array of elements to register
 */
export function useGamepadNavigation(elements: () => FocusableElement[]) {
  onMount(() => {
    // Small delay to ensure all elements are mounted
    setTimeout(() => {
      GamepadManager.registerFocusableElements(elements());
    }, 100);
  });

  onDestroy(() => {
    GamepadManager.clearFocusableElements();
  });
}

/**
 * Create a focusable element entry for a button
 * @param element HTML element
 * @param onActivate Callback when activated
 */
export function createButtonElement(element: HTMLElement, onActivate?: () => void): FocusableElement {
  return {
    element,
    type: 'button',
    onActivate
  };
}

/**
 * Create a focusable element entry for a slider
 * @param element HTML input element
 * @param onAdjust Callback when adjusted
 */
export function createSliderElement(element: HTMLInputElement, onAdjust?: (direction: 'left' | 'right') => void): FocusableElement {
  return {
    element,
    type: 'slider',
    onAdjust
  };
}

/**
 * Create a focusable element entry for an input
 * @param element HTML input element
 */
export function createInputElement(element: HTMLInputElement): FocusableElement {
  return {
    element,
    type: 'input'
  };
}

/**
 * Create a focusable element entry for a select
 * @param element HTML select element
 */
export function createSelectElement(element: HTMLSelectElement): FocusableElement {
  return {
    element,
    type: 'select'
  };
}