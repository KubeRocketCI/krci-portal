/** The values of `items` by key, in the order of the items; an item whose key is `null` is left out. */
export function groupBy<T, V>(
  items: Iterable<T>,
  keyOf: (item: T) => string | null,
  valueOf: (item: T) => V
): Map<string, V[]> {
  const groups = new Map<string, V[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (key === null) {
      continue;
    }
    const group = groups.get(key);
    if (group) {
      group.push(valueOf(item));
    } else {
      groups.set(key, [valueOf(item)]);
    }
  }
  return groups;
}
