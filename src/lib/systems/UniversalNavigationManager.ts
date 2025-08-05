import { browser } from '$app/environment';
import { PopupStore, type PopupData } from './PopupStore';

export class UniversalNavigationManager {
    private static instance: UniversalNavigationManager | null = null;
    
    private focusableElements: HTMLElement[] = [];
    private currentIndex: number = -1;
    private isNavigating: boolean = false;
    private gamepadIndex: number = 0;
    private lastGamepadTimestamp: number = 0;
    private isGameplayPage: boolean = false;
    private keyboardListener: ((e: KeyboardEvent) => void) | null = null;
    private mouseListener: ((e: MouseEvent) => void) | null = null;
    private touchListener: ((e: TouchEvent) => void) | null = null;
    private animationFrameId: number | null = null;
    private popups: PopupData[] = [];
    private popupUnsubscribe: (() => void) | null = null;

    private constructor() {
        if (browser) {
            this.setupEventListeners();
            this.startGamepadPolling();
            this.setupPopupMonitoring();
        }
    }

    public static getInstance(): UniversalNavigationManager {
        if (!UniversalNavigationManager.instance) {
            UniversalNavigationManager.instance = new UniversalNavigationManager();
        }
        return UniversalNavigationManager.instance;
    }

    private setupPopupMonitoring(): void {
        this.popupUnsubscribe = PopupStore.subscribe((popups) => {
            this.popups = popups;
            // Refresh focusable elements when popup state changes
            this.refreshFocusableElements();
        });
    }

    public setGameplayMode(isGameplay: boolean): void {
        this.isGameplayPage = isGameplay;
        if (isGameplay) {
            this.clearNavigation();
        } else {
            this.refreshFocusableElements();
        }
    }

    public refreshFocusableElements(): void {
        if (this.isGameplayPage) return;

        this.focusableElements = [];
        
        // Query all interactive elements
        const selectors = [
            'button',
            'input[type="button"]',
            'input[type="submit"]',
            'input[type="range"]',
            'select',
            'textarea',
            'input[type="text"]',
            'input[type="email"]',
            'input[type="password"]',
            'input[type="number"]',
            '[tabindex]:not([tabindex="-1"])',
            'a[href]'
        ];

        // Check if popup is open by looking at the DOM
        const popupBackdrop = document.querySelector('.popupBackdrop');
        const hasActivePopup = this.popups.length > 0 || popupBackdrop !== null;
        
        if (hasActivePopup) {
            // If popup is open, only focus on popup elements
            const popupElements = document.querySelectorAll('.popupBackdrop button, .popupBackdrop input, .popupBackdrop select, .popupBackdrop textarea, .popupBackdrop a[href]') as NodeListOf<HTMLElement>;
            
            popupElements.forEach(element => {
                if (this.isElementVisible(element) && !element.disabled) {
                    this.focusableElements.push(element);
                }
            });
        } else {
            // Query all page elements (excluding any potential popup content)
            const allElements = document.querySelectorAll(selectors.join(',')) as NodeListOf<HTMLElement>;
            
            allElements.forEach(element => {
                // Skip elements that are inside popups
                if (!element.closest('.popupBackdrop') && 
                    this.isElementVisible(element) && 
                    !element.disabled) {
                    this.focusableElements.push(element);
                }
            });
        }

        // Sort elements by their position in the DOM (top to bottom, left to right)
        this.focusableElements.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            
            if (Math.abs(rectA.top - rectB.top) > 10) {
                return rectA.top - rectB.top;
            }
            return rectA.left - rectB.left;
        });

        // Reset navigation when elements change
        this.currentIndex = -1;
        this.isNavigating = false;
    }

    private isElementVisible(element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return rect.width > 0 && 
               rect.height > 0 && 
               style.visibility !== 'hidden' && 
               style.display !== 'none' &&
               element.offsetParent !== null;
    }

    private setupEventListeners(): void {
        this.keyboardListener = (e: KeyboardEvent) => {
            if (this.isGameplayPage) {
                // Handle ESC key to potentially open pause menu in gameplay
                if (e.code === 'Escape') {
                    // Let the gameplay page handle this
                    return;
                }
                return;
            }
            this.handleKeyboardInput(e);
        };

        this.mouseListener = () => {
            this.handleMouseInput();
        };

        this.touchListener = () => {
            this.handleTouchInput();
        };

        document.addEventListener('keydown', this.keyboardListener);
        document.addEventListener('mousemove', this.mouseListener);
        document.addEventListener('touchstart', this.touchListener);
    }

    private handleKeyboardInput(e: KeyboardEvent): void {
        if (this.focusableElements.length === 0) {
            this.refreshFocusableElements();
        }

        if (this.focusableElements.length === 0) return;

        let handled = false;

        switch (e.code) {
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                this.navigateVertical(e.code === 'ArrowUp' ? -1 : 1);
                handled = true;
                break;
            
            case 'ArrowLeft':
            case 'ArrowRight':
                // For sliders, adjust value
                if (this.isNavigating && this.currentIndex >= 0) {
                    const currentElement = this.focusableElements[this.currentIndex];
                    if (currentElement && currentElement.type === 'range') {
                        e.preventDefault();
                        this.adjustSlider(currentElement as HTMLInputElement, e.code === 'ArrowRight' ? 1 : -1);
                        handled = true;
                    }
                }
                break;
            
            case 'Enter':
            case 'Space':
                if (this.isNavigating && this.currentIndex >= 0) {
                    e.preventDefault();
                    this.activateCurrentElement();
                    handled = true;
                }
                break;
        }

        if (handled) {
            this.startNavigation();
        }
    }

    private handleMouseInput(): void {
        this.stopNavigation();
    }

    private handleTouchInput(): void {
        this.stopNavigation();
    }

    private startGamepadPolling(): void {
        if (!browser) return;

        const pollGamepad = () => {
            if (this.isGameplayPage) {
                this.animationFrameId = requestAnimationFrame(pollGamepad);
                return;
            }

            const gamepads = navigator.getGamepads();
            
            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                if (gamepad && gamepad.connected) {
                    this.handleGamepadInput(gamepad);
                    break;
                }
            }
            
            this.animationFrameId = requestAnimationFrame(pollGamepad);
        };
        
        this.animationFrameId = requestAnimationFrame(pollGamepad);
    }

    private handleGamepadInput(gamepad: Gamepad): void {
        const currentTime = performance.now();
        if (currentTime - this.lastGamepadTimestamp < 150) return;

        if (this.focusableElements.length === 0) {
            this.refreshFocusableElements();
        }

        if (this.focusableElements.length === 0) return;

        let handled = false;

        // D-pad or left stick for navigation
        const upPressed = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -0.7;
        const downPressed = gamepad.buttons[13]?.pressed || gamepad.axes[1] > 0.7;
        const leftPressed = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -0.7;
        const rightPressed = gamepad.buttons[15]?.pressed || gamepad.axes[0] > 0.7;
        
        // A button (button 0) for activation
        const aPressed = gamepad.buttons[0]?.pressed;

        if (upPressed) {
            this.navigateVertical(-1);
            handled = true;
        } else if (downPressed) {
            this.navigateVertical(1);
            handled = true;
        } else if (leftPressed || rightPressed) {
            // For sliders, adjust value
            if (this.isNavigating && this.currentIndex >= 0) {
                const currentElement = this.focusableElements[this.currentIndex];
                if (currentElement && currentElement.type === 'range') {
                    this.adjustSlider(currentElement as HTMLInputElement, rightPressed ? 1 : -1);
                    handled = true;
                }
            }
        } else if (aPressed) {
            if (this.isNavigating && this.currentIndex >= 0) {
                this.activateCurrentElement();
                handled = true;
            }
        }

        if (handled) {
            this.lastGamepadTimestamp = currentTime;
            this.startNavigation();
        }
    }

    private navigateVertical(direction: number): void {
        if (this.focusableElements.length === 0) return;

        if (!this.isNavigating) {
            this.currentIndex = 0;
        } else {
            this.currentIndex = Math.max(0, Math.min(
                this.focusableElements.length - 1,
                this.currentIndex + direction
            ));
        }

        this.focusCurrentElement();
    }

    private adjustSlider(slider: HTMLInputElement, direction: number): void {
        const currentValue = parseInt(slider.value);
        const min = parseInt(slider.min) || 0;
        const max = parseInt(slider.max) || 100;
        const step = parseInt(slider.step) || 5;
        
        const newValue = Math.max(min, Math.min(max, currentValue + (direction * step)));
        slider.value = newValue.toString();
        
        // Trigger input event
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    }

    private activateCurrentElement(): void {
        if (this.currentIndex < 0 || this.currentIndex >= this.focusableElements.length) return;

        const element = this.focusableElements[this.currentIndex];
        
        if (element.tagName === 'BUTTON' || element.type === 'submit' || element.type === 'button') {
            element.click();
        } else if (element.tagName === 'A') {
            element.click();
        } else if (element.type === 'checkbox' || element.type === 'radio') {
            element.click();
        } else {
            element.focus();
        }
    }

    private focusCurrentElement(): void {
        // Remove previous navigation styles
        this.focusableElements.forEach(el => {
            el.classList.remove('nav-focused');
        });

        if (this.currentIndex >= 0 && this.currentIndex < this.focusableElements.length) {
            const element = this.focusableElements[this.currentIndex];
            element.classList.add('nav-focused');
            
            // Scroll element into view if needed
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    private startNavigation(): void {
        if (!this.isNavigating) {
            this.isNavigating = true;
            if (this.currentIndex < 0 && this.focusableElements.length > 0) {
                this.currentIndex = 0;
            }
            this.focusCurrentElement();
        }
    }

    private stopNavigation(): void {
        if (this.isNavigating) {
            this.isNavigating = false;
            // Remove all navigation styles
            this.focusableElements.forEach(el => {
                el.classList.remove('nav-focused');
            });
        }
    }

    private clearNavigation(): void {
        this.stopNavigation();
        this.focusableElements = [];
        this.currentIndex = -1;
    }

    public destroy(): void {
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
        }
        if (this.mouseListener) {
            document.removeEventListener('mousemove', this.mouseListener);
        }
        if (this.touchListener) {
            document.removeEventListener('touchstart', this.touchListener);
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.popupUnsubscribe) {
            this.popupUnsubscribe();
        }
        this.clearNavigation();
    }
}