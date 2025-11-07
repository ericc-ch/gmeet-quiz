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
              gameStore.emitEvent({
                type: "player-joined",
                payload: { user: msg.user },
              });
            }

            // Check if message is an answer (starts with !)
            if (msg.message.startsWith("!")) {
              // Add to guessing queue for game loop
              gameStore.addToGuessingQueue({
                playerName: msg.user,
                answer: msg.message.slice(1),
              });

              // Add event for immediate SSE broadcast
              gameStore.emitEvent({
                type: "answer-submitted",
                payload: { user: msg.user, answer: msg.message.slice(1) },
              });

              // Update queue event for immediate broadcast
              gameStore.emitEvent({
                type: "queue-updated",
                payload: { queue: [...gameStore.guessingQueue] },
              });
            } else {
              gameStore.emitEvent({
                type: "new-message",
                payload: { user: msg.user, message: msg.message },
              });
            }
          });

          console.log(
            "Current state",
            JSON.stringify(useGameStore.getState(), null, 2),
          );

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
