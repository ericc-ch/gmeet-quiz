import { useUIStore } from "../stores/ui.ts";
import { useGameStore } from "../stores/game.ts";

export async function startGame() {
  const selectedPage = useUIStore.getState().selectedPage;
  const logAction = useUIStore.getState().logAction;

  if (!selectedPage) {
    logAction("Cannot start game", "No page selected");
    return;
  }

  try {
    const chat = selectedPage.locator('[jsname="xySENc"]');

    const pollMessages = async () => {
      try {
        const messages = await chat.evaluate((element) => {
          const messageGroups = Array.from(element.querySelectorAll(".Ss4fHf"));
          const results: { user: string; message: string }[] = [];

          messageGroups.forEach((group) => {
            const userElement = group.querySelector(".poVWob");
            const user = userElement?.textContent?.trim() ?? "Unknown";

            const messageElements = group.querySelectorAll(
              'div[jsname="dTKtvb"] > div',
            );
            messageElements.forEach((msgElement) => {
              const message = msgElement.textContent?.trim();
              if (message) {
                results.push({ user, message });
              }
            });
          });

          return results;
        });

        const currentHistory = useGameStore.getState().messageHistory;
        const messageKeys = new Set(
          currentHistory.map((msg) => `${msg.user}-${msg.message}`),
        );

        const newMessages = messages.filter(
          (msg) => !messageKeys.has(`${msg.user}-${msg.message}`),
        );

        if (newMessages.length > 0) {
          useGameStore.getState().addMessages(newMessages);

          // Add events to queue for SSE broadcasting
          newMessages.forEach((msg) => {
            const gameStore = useGameStore.getState();

            // Check if player exists, if not add them
            if (!gameStore.players.has(msg.user)) {
              gameStore.addPlayer(msg.user, { name: msg.user, isAlive: true });
              gameStore.addEvent({
                type: "player-joined",
                payload: { user: msg.user },
              });
            }

            // Check if message is an answer (starts with !)
            if (msg.message.startsWith("!")) {
              gameStore.addEvent({
                type: "answer-submitted",
                payload: { user: msg.user, answer: msg.message.slice(1) },
              });
            } else {
              gameStore.addEvent({
                type: "new-message",
                payload: { user: msg.user, message: msg.message },
              });
            }
          });

          logAction(
            "New messages found",
            `Added ${newMessages.length} messages and events`,
          );
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    setInterval(pollMessages, 100);
    logAction("Message polling started", "Checking every 100ms");

    await pollMessages();
  } catch (error) {
    logAction(
      "Failed to start game",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function processGameEvents() {
  const gameStore = useGameStore.getState();

  while (true) {
    const event = gameStore.getNextEvent();

    if (event) {
      switch (event.type) {
        case "answer-submitted": {
          const { user, answer } = event.payload;

          // Add to guessing queue
          gameStore.addToGuessingQueue({ playerName: user, answer });

          // Send queue updated event
          gameStore.addEvent({
            type: "queue-updated",
            payload: { queue: [...gameStore.guessingQueue] },
          });

          // Start judging if game is active and not already judging
          if (gameStore.gameStatus === "ACTIVE") {
            await processGuessingQueue();
          }
          break;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function processGuessingQueue() {
  const gameStore = useGameStore.getState();

  while (
    gameStore.guessingQueue.length > 0 &&
    gameStore.gameStatus === "ACTIVE"
  ) {
    const currentGuess = gameStore.guessingQueue[0];

    if (!currentGuess) break;

    // Send start judging event
    gameStore.addEvent({
      type: "start-judging",
      payload: { playerName: currentGuess.playerName },
    });

    // Wait for walk animation (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if answer is correct
    const isCorrect =
      currentGuess.answer.toLowerCase() ===
      gameStore.currentLevel.correctAnswer.toLowerCase();

    if (isCorrect) {
      // Send correct result
      gameStore.addEvent({
        type: "judge-result",
        payload: { playerName: currentGuess.playerName, result: "correct" },
      });

      // Wait for success animation (1 second)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clear queue and transition to next level
      gameStore.clearGuessingQueue();
      await transitionToNextLevel();
      break;
    } else {
      // Send wrong result
      gameStore.addEvent({
        type: "judge-result",
        payload: { playerName: currentGuess.playerName, result: "wrong" },
      });

      // Mark player as dead for this level
      gameStore.updatePlayer(currentGuess.playerName, { isAlive: false });

      // Wait for die animation (1 second)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Remove this guess from queue and continue
      gameStore.guessingQueue.shift();
      gameStore.addEvent({
        type: "queue-updated",
        payload: { queue: [...gameStore.guessingQueue] },
      });
    }
  }
}

async function transitionToNextLevel() {
  const gameStore = useGameStore.getState();

  // Set game status to transition
  gameStore.setGameStatus("LEVEL_TRANSITION");

  // Load next level (for now, just increment level number)
  const nextLevel = {
    levelNumber: gameStore.currentLevel.levelNumber + 1,
    correctAnswer: "", // This would be set based on level data
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

  // Wait for transition animation (3 seconds)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Set game status back to active
  gameStore.setGameStatus("ACTIVE");
}
