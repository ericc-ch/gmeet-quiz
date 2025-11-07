import { create } from "zustand";
import type { Player, Guess, Level, Message, GameEvent } from "../lib/types.ts";

interface GameState {
  gameStatus: "ACTIVE" | "LEVEL_TRANSITION";
  currentLevel: Level;
  players: Map<string, Player>;
  guessingQueue: Guess[];
  messageHistory: Message[];
  eventQueue: GameEvent[];

  setGameStatus: (status: "ACTIVE" | "LEVEL_TRANSITION") => void;
  setCurrentLevel: (level: Level) => void;
  addPlayer: (id: string, player: Player) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  addToGuessingQueue: (guess: Guess) => void;
  clearGuessingQueue: () => void;
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  addEvent: (event: GameEvent) => void;
  getNextEvent: () => GameEvent | undefined;
}

export const useGameStore = create<GameState>()((set, get) => ({
  gameStatus: "ACTIVE",
  currentLevel: {
    levelNumber: 1,
    correctAnswer: "",
  },
  players: new Map(),
  guessingQueue: [],
  messageHistory: [],
  eventQueue: [],

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
  
  addEvent: (event) =>
    set((state) => ({
      eventQueue: [event, ...state.eventQueue], // unshift to front
    })),
  
  getNextEvent: () => {
    const currentQueue = get().eventQueue;
    if (currentQueue.length === 0) return undefined;
    
    const lastEvent = currentQueue[currentQueue.length - 1]; // get from back (FIFO)
    set((state) => ({
      eventQueue: state.eventQueue.slice(0, -1), // remove from back
    }));
    
    return lastEvent;
  },
}));