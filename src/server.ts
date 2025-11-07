import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { processGameEvents } from "./lib/game.ts";
import { useGameStore } from "./stores/game.ts";

export const server = new Hono();

server.get("/", (c) => {
  return c.text("GMeet Quiz Server is running.");
});

server.get("/events", async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      const event = useGameStore.getState().getNextEvent();

      console.log("Processing event:", event);

      if (event) {
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

processGameEvents();
