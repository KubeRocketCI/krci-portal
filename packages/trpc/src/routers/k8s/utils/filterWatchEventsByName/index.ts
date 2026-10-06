import type { WatchEvent } from "../createK8sWatchSubscription/index.js";

/**
 * Yields only events whose object name is in `names`.
 * Closes `source` when the consumer stops iterating.
 */
export async function* filterWatchEventsByName(
  source: AsyncGenerator<WatchEvent, void, unknown>,
  names: ReadonlySet<string>
): AsyncGenerator<WatchEvent, void, unknown> {
  try {
    for await (const event of source) {
      const name = event.data?.metadata?.name;

      if (name !== undefined && names.has(name)) {
        yield event;
      }
    }
  } finally {
    await source.return(undefined);
  }
}
