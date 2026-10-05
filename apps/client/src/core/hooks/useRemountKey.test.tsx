import { useEffect, useRef } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInActivity } from "@/test/utils/activity";
import { useRemountKey } from "./useRemountKey";

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
  return { log, ...renderInActivity(() => <Host log={log} />) };
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
