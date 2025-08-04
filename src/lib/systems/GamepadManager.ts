import { writable, type Writable } from 'svelte/store';

export interface FocusableElement {
  element: HTMLElement;
  type: 'button' | 'input' | 'select' | 'slider';
  onActivate?: () => void;
  onAdjust?: (direction: 'left' | 'right') => void;
}

class GamepadManagerClass {
  private gamepadIndex: number | null = null;
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex = 0;
  private previousButtons: boolean[] = [];
  private animationFrameId: number | null = null;

  // Store for current focused element
  public focusedElement: Writable<HTMLElement | null> = writable(null);

  constructor() {
    this.startGamepadPolling();
    this.addGamepadEventListeners();
  }

  private addGamepadEventListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad);
      this.gamepadIndex = e.gamepad.index;
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad);
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
      }
    });
  }

  private startGamepadPolling() {
    const poll = () => {
      this.pollGamepad();
      this.animationFrameId = requestAnimationFrame(poll);
    };
    poll();
  }

  private pollGamepad() {
    if (this.gamepadIndex === null) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];
    
    if (!gamepad) return;

    const currentButtons = gamepad.buttons.map(button => button.pressed);

    // Check for button presses (not held)
    for (let i = 0; i < currentButtons.length; i++) {
      if (currentButtons[i] && !this.previousButtons[i]) {
        this.handleButtonPress(i);
      }
    }

    // Handle analog stick navigation
    this.handleAnalogStick(gamepad);

    this.previousButtons = currentButtons;
  }

  private handleButtonPress(buttonIndex: number) {
    switch (buttonIndex) {
      case 0: // A button (confirm)
        this.activateCurrentElement();
        break;
      case 12: // D-pad up
        this.navigateUp();
        break;
      case 13: // D-pad down
        this.navigateDown();
        break;
      case 14: // D-pad left
        this.adjustLeft();
        break;
      case 15: // D-pad right
        this.adjustRight();
        break;
    }
  }

  private handleAnalogStick(gamepad: Gamepad) {
    const leftStickY = gamepad.axes[1];
    const leftStickX = gamepad.axes[0];
    
    // Navigation with analog stick (with deadzone)
    const deadzone = 0.5;
    const sensitivity = 0.1; // Delay between analog navigation
    
    if (leftStickY < -deadzone) {
      // Up
      this.throttledNavigate('up');
    } else if (leftStickY > deadzone) {
      // Down
      this.throttledNavigate('down');
    }

    if (leftStickX < -deadzone) {
      // Left
      this.throttledAdjust('left');
    } else if (leftStickX > deadzone) {
      // Right
      this.throttledAdjust('right');
    }
  }

  private throttledNavigate = this.throttle((direction: 'up' | 'down') => {
    if (direction === 'up') {
      this.navigateUp();
    } else {
      this.navigateDown();
    }
  }, 200);

  private throttledAdjust = this.throttle((direction: 'left' | 'right') => {
    if (direction === 'left') {
      this.adjustLeft();
    } else {
      this.adjustRight();
    }
  }, 100);

  private throttle(func: Function, wait: number) {
    let timeout: number | null = null;
    return (...args: any[]) => {
      if (timeout === null) {
        func.apply(this, args);
        timeout = window.setTimeout(() => {
          timeout = null;
        }, wait);
      }
    };
  }

  public registerFocusableElements(elements: FocusableElement[]) {
    // Clear previous selections
    this.clearSelections();
    
    this.focusableElements = elements;
    this.currentFocusIndex = 0;
    this.updateFocusedElement();
  }

  public clearFocusableElements() {
    this.clearSelections();
    this.focusableElements = [];
    this.currentFocusIndex = 0;
    this.focusedElement.set(null);
  }

  private clearSelections() {
    // Remove gamepad-selected class from all elements
    this.focusableElements.forEach(item => {
      item.element.classList.remove('gamepad-selected');
    });
  }

  private navigateUp() {
    if (this.focusableElements.length === 0) return;
    
    this.clearSelections();
    this.currentFocusIndex = (this.currentFocusIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
    this.updateFocusedElement();
  }

  private navigateDown() {
    if (this.focusableElements.length === 0) return;
    
    this.clearSelections();
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.updateFocusedElement();
  }

  private updateFocusedElement() {
    if (this.focusableElements.length === 0) return;
    
    const currentElement = this.focusableElements[this.currentFocusIndex];
    currentElement.element.classList.add('gamepad-selected');
    this.focusedElement.set(currentElement.element);
    
    // Scroll element into view if needed
    currentElement.element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest',
      inline: 'nearest'
    });
  }

  private activateCurrentElement() {
    if (this.focusableElements.length === 0) return;
    
    const currentElement = this.focusableElements[this.currentFocusIndex];
    
    if (currentElement.onActivate) {
      currentElement.onActivate();
    } else {
      // Default activation for different element types
      switch (currentElement.type) {
        case 'button':
          currentElement.element.click();
          break;
        case 'input':
        case 'select':
          currentElement.element.focus();
          break;
      }
    }
  }

  private adjustLeft() {
    if (this.focusableElements.length === 0) return;
    
    const currentElement = this.focusableElements[this.currentFocusIndex];
    
    if (currentElement.type === 'slider' && currentElement.onAdjust) {
      currentElement.onAdjust('left');
    }
  }

  private adjustRight() {
    if (this.focusableElements.length === 0) return;
    
    const currentElement = this.focusableElements[this.currentFocusIndex];
    
    if (currentElement.type === 'slider' && currentElement.onAdjust) {
      currentElement.onAdjust('right');
    }
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clearFocusableElements();
  }
}

// Singleton instance
export const GamepadManager = new GamepadManagerClass();