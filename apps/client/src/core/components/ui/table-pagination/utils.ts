/** A total is usable only as a non-negative safe integer. Anything else reads as unknown. */
export const isKnownTotal = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
