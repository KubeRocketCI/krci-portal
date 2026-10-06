import { describe, expect, it, vi } from "vitest";
import { filterWatchEventsByName } from "./index.js";
import type { WatchEvent } from "../createK8sWatchSubscription/index.js";

function makeEvent(name?: string): WatchEvent {
  return {
    type: "ADDED",
    data: { apiVersion: "v1", kind: "Test", metadata: name === undefined ? {} : { name } } as WatchEvent["data"],
  };
}

async function* fromArray(events: WatchEvent[]): AsyncGenerator<WatchEvent, void, unknown> {
  for (const event of events) {
    yield event;
  }
}

async function collect(source: AsyncGenerator<WatchEvent, void, unknown>): Promise<WatchEvent[]> {
  const result: WatchEvent[] = [];
  for await (const event of source) {
    result.push(event);
  }
  return result;
}

describe("filterWatchEventsByName", () => {
  it("yields events for listed names only", async () => {
    const source = fromArray([makeEvent("a"), makeEvent("b"), makeEvent("c"), makeEvent("a")]);

    const result = await collect(filterWatchEventsByName(source, new Set(["a", "c"])));

    expect(result.map((event) => event.data.metadata.name)).toEqual(["a", "c", "a"]);
  });

  it("drops events without metadata.name", async () => {
    const source = fromArray([makeEvent(), makeEvent("a")]);

    const result = await collect(filterWatchEventsByName(source, new Set(["a"])));

    expect(result).toHaveLength(1);
    expect(result[0].data.metadata.name).toBe("a");
  });

  it("closes the source generator when the consumer returns", async () => {
    const onClose = vi.fn();

    async function* infiniteSource(): AsyncGenerator<WatchEvent, void, unknown> {
      try {
        let i = 0;
        while (true) {
          yield makeEvent(`a-${i++}`);
        }
      } finally {
        onClose();
      }
    }

    const source = infiniteSource();
    const filtered = filterWatchEventsByName(source, new Set(["a-0", "a-1", "a-2"]));

    const first = await filtered.next();
    expect(first.done).toBe(false);

    await filtered.return(undefined);

    expect(onClose).toHaveBeenCalledTimes(1);
    await expect(source.next()).resolves.toEqual({ done: true, value: undefined });
  });
});
