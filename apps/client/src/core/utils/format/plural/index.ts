/** `noun` takes a plain `s` in the plural. */
export const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;
