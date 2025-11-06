import { useKeyboard, useRenderer } from "@opentui/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createContext } from "./lib/browser.ts";
import { usePageStore } from "./stores/app.ts";

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

function Main() {
  const renderer = useRenderer();
  const queryClient = useQueryClient();
  const setSelectedPage = usePageStore((state) => state.setSelectedPage);

  const [lastAction, setLastAction] = useState<ActionLog>({
    timestamp: formatter.format(new Date()),
    action: "Initialized",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const logAction = (action: string, description?: string) => {
    setLastAction({
      timestamp: formatter.format(new Date()),
      action,
      description,
    });
  };

  const pagesQuery = useQuery({
    queryKey: ["pages"],
    queryFn: () => context.pages(),
  });

  const handleRefresh = () => {
    logAction("Refresh called");
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

  const handleSelectionUp = () => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSelectionDown = () => {
    setSelectedIndex((prev) =>
      Math.min((pagesQuery.data?.length ?? 1) - 1, prev + 1),
    );
  };

  const handleSelectPage = () => {
    const selectedPage = pagesQuery.data?.[selectedIndex];
    if (selectedPage) {
      setSelectedPage(selectedPage);
      logAction(
        "Page selected",
        `Page ${selectedIndex + 1}: ${selectedPage.url()}`,
      );
      console.log("Selected page:", selectedPage.url());
    }
  };

  useEffect(() => {
    setSelectedIndex(0); // Reset selection to first item
  }, [pagesQuery.data]);

  useKeyboard((key) => {
    switch (key.name) {
      case "up":
        handleSelectionUp();
        break;
      case "down":
        handleSelectionDown();
        break;
      case "return":
        handleSelectPage();
        break;
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
      {pagesQuery.isPending ? (
        <text>Loading...</text>
      ) : pagesQuery.isError ? (
        <text>Error: {pagesQuery.error?.message}</text>
      ) : (
        <box style={{ border: true, flexGrow: 1 }}>
          {pagesQuery.data?.map((page: any, index: number) => (
            <text key={index}>
              {index === selectedIndex ? "▶ " : "  "}
              <strong>{index + 1}.</strong> {page.url()}
            </text>
          ))}
        </box>
      )}

      <box style={{ border: true }}>
        <text>
          <strong>Controls:</strong>
          ↑/↓: Navigate | Enter: Select | n: New Page | r: Refresh | q: Quit
        </text>
      </box>

      <box style={{ border: true }}>
        <text>
          {lastAction.timestamp} | {lastAction.action}
        </text>
      </box>
    </box>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Main />
    </QueryClientProvider>
  );
}
