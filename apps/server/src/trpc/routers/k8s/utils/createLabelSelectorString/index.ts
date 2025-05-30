export const createLabelSelectorString = (
  labels: Record<string, string> | undefined
): string | undefined => {
  if (!labels) {
    return undefined;
  }

  return Object.entries(labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
};
