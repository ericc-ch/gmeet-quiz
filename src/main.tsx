import { ConsolePosition, createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app.tsx";
import { server } from "./server.ts";
import html from "./index.html";

// Start the server
Bun.serve({
  fetch: server.fetch,
  idleTimeout: 0,
});

Bun.serve({
  routes: {
    "/src/assets/*": async (req) => {
      const path = new URL(req.url).pathname;
      const file = Bun.file(path.slice(1)); // Remove leading slash
      return new Response(file);
    },
    "/*": html,
  },
  port: 4000,
  development: {
    console: false,
  },
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
