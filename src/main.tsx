import { ConsolePosition, createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app.tsx";
import { server } from "./server.ts";

// Start the server
Bun.serve({
  fetch: server.fetch,
  idleTimeout: 0,
});

// Start the TUI
export const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  consoleOptions: {
    position: ConsolePosition.RIGHT,
    sizePercent: 30,
  },
});

createRoot(renderer).render(<App />);
