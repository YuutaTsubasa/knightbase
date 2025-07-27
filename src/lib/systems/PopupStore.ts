import { writable } from 'svelte/store';

export enum PopupResult {
  Keep,
  Close
}

export type PopupButton = {
  text: string;
  className?: string;
  onClickEvent?: {
    handler: () => PopupResult,
    sfx?: string
  }
};

export type PopupData = {
  id: number;
  title: string;
  content: string;
  buttons: PopupButton[];
  resolve: (index: number) => void;
};

const popupList = writable<PopupData[]>([]);
let idCounter = 0;

function open({
  title,
  content,
  buttons,
}: Omit<PopupData, 'id' | 'resolve'>): Promise<number> {
  return new Promise<number>((resolve) => {
    const popup: PopupData = {
      id: ++idCounter,
      title,
      content,
      buttons,
      resolve
    };
    popupList.update((list) => [...list, popup]);
  });
}

function close(id: number) {
  popupList.update((list) => list.filter((p) => p.id !== id));
}

export const PopupStore = {
  subscribe: popupList.subscribe,
  open,
  close
};
