import { create } from "zustand";
import type { Player, Guess, Level, Message, GameEvent } from "../lib/types.ts";
import { getLevel } from "../lib/levels.ts";

type EventListener = (event: GameEvent) => void;

interface GameState {
  gameStatus: "ACTIVE" | "LEVEL_TRANSITION";
  currentLevel: Level;
  players: Map<string, Player>;
  guessingQueue: Guess[];
  messageHistory: Message[];
  eventListeners: Set<EventListener>;

  setGameStatus: (status: "ACTIVE" | "LEVEL_TRANSITION") => void;
  setCurrentLevel: (level: Level) => void;
  addPlayer: (id: string, player: Player) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  addToGuessingQueue: (guess: Guess) => void;
  clearGuessingQueue: () => void;
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  emitEvent: (event: GameEvent) => void;
  addEventListener: (listener: EventListener) => void;
  removeEventListener: (listener: EventListener) => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  gameStatus: "ACTIVE",
  currentLevel: getLevel(1) ?? {
    levelNumber: 1,
    question: "",
    correctAnswer: "",
  },
  players: new Map(),
  guessingQueue: [],
  messageHistory: [],
  eventListeners: new Set(),

  setGameStatus: (status) => set({ gameStatus: status }),

  setCurrentLevel: (level) => set({ currentLevel: level }),

  addPlayer: (id, player) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.set(id, player);
      return { players: newPlayers };
    }),

  removePlayer: (id) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.delete(id);
      return { players: newPlayers };
    }),

  updatePlayer: (id, playerUpdate) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      const existingPlayer = newPlayers.get(id);
      if (existingPlayer) {
        newPlayers.set(id, { ...existingPlayer, ...playerUpdate });
      }
      return { players: newPlayers };
    }),

  addToGuessingQueue: (guess) =>
    set((state) => ({
      guessingQueue: [...state.guessingQueue, guess],
    })),

  clearGuessingQueue: () => set({ guessingQueue: [] }),

  addMessage: (message) =>
    set((state) => ({
      messageHistory: [...state.messageHistory, message],
    })),

  addMessages: (messages) =>
    set((state) => ({
      messageHistory: [...state.messageHistory, ...messages],
    })),

  emitEvent: (event) => {
    const listeners = get().eventListeners;
    console.log(`Emitting event to ${listeners.size} listener(s):`, event);
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
  },

  addEventListener: (listener) =>
    set((state) => {
      const newListeners = new Set(state.eventListeners);
      newListeners.add(listener);
      console.log(
        `Added event listener. Total listeners: ${newListeners.size}`,
      );
      return { eventListeners: newListeners };
    }),

  removeEventListener: (listener) =>
    set((state) => {
      const newListeners = new Set(state.eventListeners);
      newListeners.delete(listener);
      console.log(
        `Removed event listener. Total listeners: ${newListeners.size}`,
      );
      return { eventListeners: newListeners };
    }),
}));
