import { render, useKeyboard, useRenderer } from "@opentui/solid";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/solid-query";
import { createSignal, For, Switch, Match, createEffect } from "solid-js";
import { createContext } from "./browser.ts";
import { ConsolePosition } from "@opentui/core";

const context = await createContext();
const queryClient = new QueryClient();

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface ActionLog {
  timestamp: string;
  action: string;
  description?: string;
}

function PageSelector() {
  const renderer = useRenderer();
  const queryClient = useQueryClient();

  const [lastAction, setLastAction] = createSignal<ActionLog>({
    timestamp: formatter.format(new Date()),
    action: "Initialized",
  });

  const logAction = (action: string, description?: string) => {
    setLastAction({
      timestamp: formatter.format(new Date()),
      action,
      description,
    });
  };

  const pagesQuery = useQuery(() => ({
    queryKey: ["pages"],
    queryFn: async () => {
      const pages = context.pages();
      console.log(pages.map((page) => page.url()));
      return pages;
    },
  }));

  const handleRefresh = () => {
    logAction("Refresh called");
    // pagesQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ["pages"] });
  };

  const handleCreateNewPage = async () => {
    try {
      const newPage = await context.newPage();
      logAction("New page created", `Page ID: ${newPage.url()}`);
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    } catch (error) {
      logAction(
        "Failed to create page",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  createEffect(() => {
    console.log("Pages data updated:", pagesQuery.data?.length);
  });

  useKeyboard((key) => {
    switch (key.name) {
      case "r":
        handleRefresh();
        break;
      case "n":
        handleCreateNewPage();
        break;
      case "q":
        logAction("Quitting application");
        process.exit(0);
      case "f12":
        renderer.console.toggle();
        break;
    }
  });

  return (
    <box
      style={{
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Switch>
        <Match when={pagesQuery.isPending}>
          <text>Loading...</text>
        </Match>

        <Match when={pagesQuery.isError}>
          <text>Error: {pagesQuery.error?.message}</text>
        </Match>

        <Match when={pagesQuery.isSuccess}>
          <box style={{ border: true, flexGrow: 1 }}>
            <For each={pagesQuery.data}>
              {(page, index) => (
                <text>
                  <strong>{index() + 1}.</strong> {page.url()}
                </text>
              )}
            </For>
          </box>
        </Match>
      </Switch>

      <box style={{ border: true }}>
        <text>
          <strong>Controls:</strong>
          ↑/↓: Navigate | n: New Page | r: Refresh | q: Quit
        </text>
      </box>

      <box style={{ border: true }}>
        <text>
          {lastAction().timestamp} | {lastAction().action}
        </text>
      </box>

      <box style={{ border: true }}>
        <text>
          {pagesQuery.status} | {JSON.stringify(pagesQuery.data)} |{" "}
          {pagesQuery.dataUpdatedAt}
        </text>
      </box>
    </box>
  );
}

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <PageSelector />
    </QueryClientProvider>
  ),
  {
    exitOnCtrlC: true,
    consoleOptions: {
      position: ConsolePosition.RIGHT,
      sizePercent: 30,
    },
  },
);

// await page.goto("https://accounts.google.com/signin");
// await page.locator("#identifierId").fill(env.GOOGLE_EMAIL);
// await page.getByText("Next").click();
// await page.locator("input[name=Passwd]").fill(env.GOOGLE_PASSWORD);
// await page.getByRole("button", { name: "Next" }).click();

// // Wait til signed in
// // page.waitForURL("https://myaccount.google.com/**");
// await Bun.sleep(5_000);

// await context.goto(env.GMEET_URL);
