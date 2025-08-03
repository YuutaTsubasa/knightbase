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
  autoClose?: boolean;
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
  });
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
