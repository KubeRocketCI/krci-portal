/**
 * Creates an event queue that bridges callback/stream-based APIs to async generators.
 * This utility handles the common pattern of queuing events and yielding them in a generator.
 */
export function createEventQueue<TEvent, TError = unknown>() {
  const eventQueue: Array<TEvent | { error: TError }> = [];
  let resolveNext: (() => void) | null = null;
  let isAborted = false;

  const emit = (event: TEvent) => {
    if (!isAborted) {
      eventQueue.push(event);
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    }
  };

  const emitError = (error: TError) => {
    if (!isAborted) {
      eventQueue.push({ error } as TEvent | { error: TError });
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    }
  };

  const abort = () => {
    isAborted = true;
    if (resolveNext) {
      resolveNext();
      resolveNext = null;
    }
  };

  const waitForNext = async (signal?: AbortSignal): Promise<void> => {
    if (eventQueue.length > 0) {
      return;
    }
    if (signal?.aborted) {
      return;
    }
    return new Promise<void>((resolve) => {
      resolveNext = resolve;
      if (signal?.aborted) {
        resolve();
      }
    });
  };

  const shift = (): (TEvent | { error: TError }) | undefined => {
    return eventQueue.shift();
  };

  const isEmpty = (): boolean => {
    return eventQueue.length === 0;
  };

  return {
    emit,
    emitError,
    abort,
    waitForNext,
    shift,
    isEmpty,
    get isAborted() {
      return isAborted;
    },
  };
}

/**
 * Yields events from an event queue in an async generator pattern.
 * Handles errors by throwing them, and respects abort signals.
 */
export async function* yieldEvents<TEvent, TError = unknown>(
  queue: ReturnType<typeof createEventQueue<TEvent, TError>>,
  signal?: AbortSignal,
  handleError?: (error: TError) => unknown
): AsyncGenerator<TEvent, void, unknown> {
  while (!queue.isAborted && !signal?.aborted) {
    await queue.waitForNext(signal);

    while (!queue.isEmpty() && !signal?.aborted) {
      const event = queue.shift();
      if (!event) break;

      if (typeof event === "object" && event !== null && "error" in event) {
        const error = (event as { error: TError }).error;
        if (handleError) {
          throw handleError(error);
        }
        throw error;
      }

      yield event as TEvent;
    }
  }
}
