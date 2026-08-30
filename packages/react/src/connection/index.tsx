import { createContext, useContext, type ComponentPropsWithoutRef, type PropsWithChildren } from "react";
import type { ConnectionState } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

interface ConnectionContextValue {
  connection: ConnectionState;
  onRetry: (() => void) | undefined;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export interface ConnectionRootProps extends PropsWithChildren<ComponentPropsWithoutRef<"section">> {
  connection?: ConnectionState;
  onRetry?(): void;
}

function Frame({ connection, onRetry, children, ...props }: ConnectionRootProps & { connection: ConnectionState }) {
  return (
    <ConnectionContext.Provider value={{ connection, onRetry }}>
      <section
        aria-label="Connection status"
        aria-busy={connection.status === "reconnecting"}
        data-aifk-connection=""
        data-status={connection.status}
        data-attempt={connection.attempt}
        {...props}
      >
        {children}
      </section>
    </ConnectionContext.Provider>
  );
}

function RuntimeRoot(props: ConnectionRootProps) {
  const connection = useRuntimeState((state) => state.connection);
  return <Frame {...props} connection={connection} />;
}

function Root({ connection, ...props }: ConnectionRootProps) {
  return connection ? <Frame {...props} connection={connection} /> : <RuntimeRoot {...props} />;
}

const statusMessages = {
  connected: "Connected",
  reconnecting: "Reconnecting",
  offline: "You are offline",
  failed: "Connection failed"
} as const;

function Status(props: ComponentPropsWithoutRef<"span">) {
  const { connection } = useConnection();
  return <span role="status" aria-live="polite" aria-atomic="true" {...props}>{props.children ?? statusMessages[connection.status]}</span>;
}

function Message(props: ComponentPropsWithoutRef<"p">) {
  const { connection } = useConnection();
  const fallback = connection.error ?? connection.reason ?? statusMessages[connection.status];
  return <p {...props}>{props.children ?? fallback}</p>;
}

function Retry(props: ComponentPropsWithoutRef<"button">) {
  const { connection, onRetry } = useConnection();
  if (connection.status !== "offline" && connection.status !== "failed") return null;
  const disabled = Boolean(props.disabled) || (!onRetry && !props.onClick);
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) onRetry?.();
      }}
    >
      {props.children ?? "Retry connection"}
    </button>
  );
}

function useConnection() {
  const value = useContext(ConnectionContext);
  if (!value) throw new Error("ConnectionPrimitive component must be inside ConnectionPrimitive.Root.");
  return value;
}

export const ConnectionPrimitive = { Root, Status, Message, Retry };
