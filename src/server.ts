import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { useGameStore } from "./stores/game.ts";

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
        gameStore.addEvent({
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
        gameStore.addEvent({
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
          gameStore.addEvent({
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

  const nextLevel = {
    levelNumber: gameStore.currentLevel.levelNumber + 1,
    correctAnswer: "",
  };
  gameStore.setCurrentLevel(nextLevel);

  // Revive all players
  const allPlayers = Array.from(gameStore.players.values());
  allPlayers.forEach((player) => {
    gameStore.updatePlayer(player.name, { isAlive: true });
  });

  // Send load level event
  gameStore.addEvent({
    type: "load-level",
    payload: {
      level: nextLevel,
      players: Array.from(gameStore.players.values()),
    },
  });

  gameStore.setGameStatus("ACTIVE");
}

server.get("/events", async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      const event = useGameStore.getState().getNextEvent();

      if (event) {
        console.log("Broadcasting event:", event);

        // Just broadcast, no processing
        await stream.writeSSE({
          data: JSON.stringify(event),
          event: event.type,
        });
      } else {
        await stream.sleep(100);
      }
    }
  });
});
