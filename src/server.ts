import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { useGameStore } from "./stores/game.ts";
import { getLevel, getTotalLevels } from "./lib/levels.ts";
import { cors } from "hono/cors";

export const server = new Hono();

server.get("/", (c) => {
  return c.text("GMeet Quiz Server is running.");
});

// Start game loop immediately
startGameLoop();

async function startGameLoop() {
  while (true) {
    const gameStore = useGameStore.getState();

    if (
      gameStore.guessingQueue.length > 0 &&
      gameStore.gameStatus === "ACTIVE"
    ) {
      const currentGuess = gameStore.guessingQueue[0];

      if (currentGuess) {
        // Send start judging event
        gameStore.emitEvent({
          type: "start-judging",
          payload: { playerName: currentGuess.playerName },
        });

        // Dramatic delay (1 second)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Judge answer
        const isCorrect =
          currentGuess.answer.toLowerCase() ===
          gameStore.currentLevel.correctAnswer.toLowerCase();

        // Send result
        gameStore.emitEvent({
          type: "judge-result",
          payload: {
            playerName: currentGuess.playerName,
            result: isCorrect ? "correct" : "wrong",
          },
        });

        // Update game state
        if (isCorrect) {
          gameStore.clearGuessingQueue();
          await transitionToNextLevel();
        } else {
          gameStore.updatePlayer(currentGuess.playerName, { isAlive: false });
          gameStore.guessingQueue.shift();
          gameStore.emitEvent({
            type: "queue-updated",
            payload: { queue: [...gameStore.guessingQueue] },
          });
        }
      }
    } else {
      // No guesses to process, wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

async function transitionToNextLevel() {
  const gameStore = useGameStore.getState();

  gameStore.setGameStatus("LEVEL_TRANSITION");

  const nextLevelNumber = gameStore.currentLevel.levelNumber + 1;
  const totalLevels = getTotalLevels();

  let newLevel;
  // Check if we've completed all levels
  if (nextLevelNumber > totalLevels) {
    // Game completed - restart from level 1
    const firstLevel = getLevel(1);
    if (firstLevel) {
      gameStore.setCurrentLevel(firstLevel);
      newLevel = firstLevel;
    }
  } else {
    // Load next level
    const nextLevel = getLevel(nextLevelNumber);
    if (nextLevel) {
      gameStore.setCurrentLevel(nextLevel);
      newLevel = nextLevel;
    }
  }

  // Revive all players in a single batch
  const allPlayers = Array.from(gameStore.players.values());
  const revivedPlayers = allPlayers.map((player) => ({
    ...player,
    isAlive: true,
  }));

  // Update all players at once
  revivedPlayers.forEach((player) => {
    gameStore.updatePlayer(player.name, { isAlive: true });
  });

  // Send load level event with the new level and revived players
  if (newLevel) {
    gameStore.emitEvent({
      type: "load-level",
      payload: {
        level: newLevel,
        players: revivedPlayers,
      },
    });
  }

  gameStore.setGameStatus("ACTIVE");
}

server.use(
  cors({
    origin: "*",
  }),
);
server.get("/events", async (c) => {
  return streamSSE(c, async (stream) => {
    // Send initial game state on connection
    const gameStore = useGameStore.getState();
    const initialStateEvent = {
      type: "game-state" as const,
      payload: {
        gameStatus: gameStore.gameStatus,
        currentLevel: gameStore.currentLevel,
        players: Array.from(gameStore.players.values()),
        guessingQueue: gameStore.guessingQueue,
      },
    };

    console.log("Sending initial game state:", initialStateEvent);
    await stream.writeSSE({
      data: JSON.stringify(initialStateEvent),
      event: "game-state",
    });

    // Set up event listener for this SSE connection
    const eventListener = async (event: any) => {
      try {
        console.log("Broadcasting event to client:", event);
        await stream.writeSSE({
          data: JSON.stringify(event),
          event: event.type,
        });
      } catch (error) {
        console.error("Error broadcasting event:", error);
      }
    };

    // Register the listener
    gameStore.addEventListener(eventListener);

    // Keep connection alive and clean up on disconnect
    try {
      while (true) {
        await stream.sleep(1000);
      }
    } finally {
      // Remove listener when connection closes
      gameStore.removeEventListener(eventListener);
      console.log("SSE connection closed, listener removed");
    }
  });
});
