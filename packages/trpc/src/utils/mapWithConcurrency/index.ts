/**
 * Maps `items` through `fn` with at most `limit` calls in flight. Results keep input order.
 * Rejects with the first rejection from `fn`; no new items start after it.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let failed = false;

  const worker = async () => {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));

  return results;
}
