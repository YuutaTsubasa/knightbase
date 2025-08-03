import type { ButtonVariant } from '$lib/utils/Constant';
import { writable } from 'svelte/store';

export enum PopupResult {
  Keep,
  Close
}

export type PopupButton = {
  text: string;
  variant?: ButtonVariant;
  onClick?: () => PopupResult;
};

export type PopupData = {
  id: number;
  title: string;
  content: string;
  buttons: PopupButton[];
  resolve: (index: number) => void;
  autoClose?: boolean | (() => boolean);
};

const popupList = writable<PopupData[]>([]);
let idCounter = 0;

function open({
  title,
  content,
  buttons,
  autoClose = false,
}: Omit<PopupData, 'id' | 'resolve'>): Promise<number> {
  return new Promise<number>((resolve) => {
    const popup: PopupData = {
      id: ++idCounter,
      title,
      content,
      buttons,
      resolve,
      autoClose
    };
    popupList.update((list) => [...list, popup]);
    
    // If autoClose is a function, start checking the condition
    if (typeof autoClose === 'function') {
      checkAutoCloseCondition(popup.id, autoClose);
    }
  });
}

function checkAutoCloseCondition(id: number, condition: () => boolean) {
  const interval = setInterval(() => {
    popupList.update((list) => {
      const popup = list.find(p => p.id === id);
      if (!popup) {
        clearInterval(interval);
        return list;
      }
      
      if (condition()) {
        clearInterval(interval);
        popup.resolve(-1); // -1 indicates auto-close
        return list.filter((p) => p.id !== id);
      }
      
      return list;
    });
  }, 100); // Check every 100ms
}

function close(id: number) {
  popupList.update((list) => list.filter((p) => p.id !== id));
}

function autoClose(id: number) {
  popupList.update((list) => {
    const popup = list.find(p => p.id === id);
    if (popup && popup.autoClose) {
      popup.resolve(-1); // -1 indicates auto-close
      return list.filter((p) => p.id !== id);
    }
    return list;
  });
}

export const PopupStore = {
  subscribe: popupList.subscribe,
  open,
  close,
  autoClose
};
