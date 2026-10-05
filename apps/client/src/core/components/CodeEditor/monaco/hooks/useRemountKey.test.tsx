import { Activity, useEffect, useRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRemountKey } from "./useRemountKey";

type Mode = "visible" | "hidden";

// Mirrors @monaco-editor/react: creates once, disposes in cleanup, keeps the ref and reuses it on reconnect.
function DisposingChild({ log }: { log: string[] }) {
  const resource = useRef<{ disposed: boolean } | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!resource.current) {
      resource.current = { disposed: false };
      log.push("create");
    }
    const current = resource.current;
    return () => {
      current.disposed = true;
      log.push("dispose");
    };
  }, [log]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    log.push(resource.current?.disposed ? "use disposed" : "use");
  }, [log]);

  return null;
}

function Host({ log }: { log: string[] }) {
  const remountKey = useRemountKey();
  return (
    <>
      <p>key {remountKey}</p>
      <DisposingChild key={remountKey} log={log} />
    </>
  );
}

const renderHost = () => {
  const log: string[] = [];
  const ui = (mode: Mode) => (
    <Activity mode={mode}>
      <Host log={log} />
    </Activity>
  );
  const view = render(ui("visible"));
  const setMode = (mode: Mode) => view.rerender(ui(mode));
  const reshow = () => {
    setMode("hidden");
    setMode("visible");
  };
  return { log, setMode, reshow };
};

describe("useRemountKey", () => {
  it("keeps the key across re-renders while visible", () => {
    const { setMode } = renderHost();

    setMode("visible");
    setMode("visible");

    expect(screen.getByText("key 0")).toBeInTheDocument();
  });

  it("changes the key once per hide and show cycle", () => {
    const { reshow } = renderHost();

    reshow();
    expect(screen.getByText("key 1")).toBeInTheDocument();

    reshow();
    expect(screen.getByText("key 2")).toBeInTheDocument();
  });

  it("mounts a fresh child on show instead of reconnecting the disposed one", () => {
    const { log, reshow } = renderHost();

    reshow();
    reshow();

    expect(log).toEqual(["create", "dispose", "create", "dispose", "create"]);
  });
});
