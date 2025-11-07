export interface Player {
  name: string;
  isAlive: boolean;
  velocityX?: number;
  velocityY?: number;
  targetX?: number;
  targetY?: number;
  speed?: number;
}

export interface Guess {
  playerName: string;
  answer: string;
}

export interface Level {
  levelNumber: number;
  question: string;
  correctAnswer: string;
}

export interface Message {
  user: string;
  message: string;
}

export type GameEvent =
  | { type: "new-message"; payload: { user: string; message: string } }
  | { type: "player-joined"; payload: { user: string } }
  | { type: "answer-submitted"; payload: { user: string; answer: string } }
  | { type: "start-judging"; payload: { playerName: string } }
  | {
      type: "judge-result";
      payload: { playerName: string; result: "correct" | "wrong" };
    }
  | { type: "load-level"; payload: { level: Level; players: Player[] } }
  | { type: "queue-updated"; payload: { queue: Guess[] } }
  | {
      type: "game-state";
      payload: {
        gameStatus: "ACTIVE" | "LEVEL_TRANSITION";
        currentLevel: Level;
        players: Player[];
        guessingQueue: Guess[];
      };
    };
