const nameCollator = new Intl.Collator(undefined, { sensitivity: "accent" });

export const sortByName = (a?: string, b?: string): number => {
  if (a && b) {
    return nameCollator.compare(a, b);
  }

  if (a && !b) {
    return -1;
  }

  if (!a && b) {
    return 1;
  }

  return 0;
};
