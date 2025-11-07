import { useKeyboard, useRenderer } from "@opentui/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LastAction } from "./components/last-action.tsx";
import { createContext } from "./lib/browser.ts";
import { startGame } from "./lib/game.ts";
import { useUIStore } from "./stores/ui.ts";
import { useGameStore } from "./stores/game.ts";

const context = await createContext();
const queryClient = new QueryClient();

function Main() {
  const renderer = useRenderer();
  const queryClient = useQueryClient();
  const setSelectedPage = useUIStore((state) => state.setSelectedPage);
  const selectedPage = useUIStore((state) => state.selectedPage);
  const logAction = useUIStore((state) => state.logAction);

  const gameState = useGameStore((state) => state);

  const [selectedIndex, setSelectedIndex] = useState(0);

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
      case "g":
        startGame();
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
      <box style={{ flexDirection: "row", flexGrow: 1 }}>
        <box style={{ border: true, width: "30%" }}>
          {pagesQuery.isPending ? (
            <text>Loading...</text>
          ) : pagesQuery.isError ? (
            <text>Error: {pagesQuery.error?.message}</text>
          ) : (
            pagesQuery.data?.map((page: any, index: number) => (
              <text
                key={index}
                style={{
                  bg: page === selectedPage ? "blue" : undefined,
                }}
              >
                {index === selectedIndex ? "▶ " : "  "}
                <strong>{index + 1}.</strong> {page.url()}
              </text>
            ))
          )}
        </box>

        <box
          style={{
            border: true,
            flexGrow: 1,
            flexDirection: "column",
            padding: 1,
          }}
        >
          <text style={{ bg: "blue" }}>
            <strong>{JSON.stringify(gameState)}</strong>
          </text>
        </box>
      </box>

      <box style={{ border: true }}>
        <text>
          <strong>Controls: </strong>
          ↑/↓: Navigate | Enter: Select | n: New Page | r: Refresh | g: Start
          Game | q: Quit
        </text>
      </box>

      <LastAction />
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
