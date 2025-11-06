import type { Page } from "playwright";
import { create } from "zustand";

interface PageStore {
  selectedPage: Page | undefined;
  setSelectedPage: (page: Page) => void;
}

export const usePageStore = create<PageStore>()((set) => ({
  selectedPage: undefined,
  setSelectedPage: (page) => set({ selectedPage: page }),
}));
