import { appendQuery } from "../../http/index.js";
import type { DefectDojoRequest } from "../requests.js";

/** Origin written in place of the DefectDojo address wherever an answer repeats it (`next`, `previous`). */
export const ANSWER_ORIGIN = "https://defectdojo.example.test";

/** One recorded answer of DefectDojo. */
export interface RecordedAnswer {
  /** `requestKey` of the request that got the answer. */
  request: string;
  status: number;
  body: unknown;
}

export interface RecordedAnswers {
  /** The DefectDojo version of the testbed the answers come from. */
  version: string;
  answers: RecordedAnswer[];
}

/**
 * Identity of a GET request: the path and the query parameters in alphabetical order.
 * A recorded answer is found by this key, so the order the client builds its query in does not matter.
 */
export function requestKey(path: string, params: URLSearchParams): string {
  const sorted = new URLSearchParams(params);
  sorted.sort();
  return `GET ${path}?${sorted}`;
}

/** `requestKey` of a request as the HTTP transport sends it. */
export function requestKeyOf(request: DefectDojoRequest): string {
  const { pathname, searchParams } = new URL(appendQuery(request.path, request.query), ANSWER_ORIGIN);
  return requestKey(pathname, searchParams);
}
