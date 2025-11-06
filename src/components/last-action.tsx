import { usePageStore } from "../stores/app.ts";

export function LastAction() {
  const lastAction = usePageStore((state) => state.lastAction);

  return (
    <box style={{ border: true }}>
      <text>
        {lastAction.timestamp} | {lastAction.action}
      </text>
    </box>
  );
}
