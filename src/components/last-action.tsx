import { useUIStore } from "../stores/ui.ts";

export function LastAction() {
  const lastAction = useUIStore((state) => state.lastAction);

  return (
    <box style={{ border: true }}>
      <text>
        {lastAction.timestamp} | {lastAction.action} | {lastAction.description}
      </text>
    </box>
  );
}
