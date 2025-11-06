import type { Page } from "playwright";
import { create } from "zustand";

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface ActionLog {
  timestamp: string;
  action: string;
  description?: string;
}

interface PageStore {
  selectedPage: Page | undefined;
  setSelectedPage: (page: Page) => void;
  lastAction: ActionLog;
  logAction: (action: string, description?: string) => void;
}

export const usePageStore = create<PageStore>()((set) => ({
  selectedPage: undefined,
  setSelectedPage: (page) => set({ selectedPage: page }),

  lastAction: {
    timestamp: formatter.format(new Date()),
    action: "Initialized",
  },
  logAction: (action, description) =>
    set({
      lastAction: {
        timestamp: formatter.format(new Date()),
        action,
        description,
      },
    }),
}));
