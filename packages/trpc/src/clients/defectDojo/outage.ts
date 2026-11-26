import type { DefectDojoResult } from "./types.js";

/** A read that failed: DefectDojo is not configured, or it did not answer. */
export type DefectDojoOutage = Extract<DefectDojoResult<never>, { state: "notConfigured" | "unreachable" }>;

export function isOutage(result: { state: string }): result is DefectDojoOutage {
  return result.state === "notConfigured" || result.state === "unreachable";
}

/** Stops a composition of reads at the first failed one. */
export class OutageFound extends Error {
  constructor(readonly outage: DefectDojoOutage) {
    super(outage.state);
  }
}

/** The data of a read, or `null` for no scan data. An outage throws `OutageFound`. */
export function dataOf<T>(result: DefectDojoResult<T>): T | null {
  if (isOutage(result)) {
    throw new OutageFound(result);
  }
  return result.state === "data" ? result.data : null;
}

/** The outage a composition stopped at. Any other error is thrown on. */
export function outageOf(error: unknown): DefectDojoOutage {
  if (error instanceof OutageFound) {
    return error.outage;
  }
  throw error;
}
