import type { QueryClient } from "@tanstack/react-query";
import {
  isRuntimeFindingState,
  securityOverviewCodebasesSchema,
  securityOverviewSchema,
  type DefectDojoFindingState,
  type SecurityOverview,
  type SecurityOverviewCodebases,
} from "@my-project/shared";
import { securityOverviewCodebasesKey, securityOverviewKey } from "../hooks/useSecurityOverview";
import testbed from "./testbed.json";

export const OVERVIEW_NAMESPACE = testbed.runtime.active.input.namespace;

export interface OverviewAnswers {
  state?: DefectDojoFindingState;
  /** Left out, and under Mitigated: the page asks for no Runtime part. */
  runtime?: SecurityOverview;
  codebases: SecurityOverviewCodebases;
}

/** The states the Codebases part is recorded for; the Runtime part is recorded for Active and False positive. */
export type RecordedState = keyof typeof testbed.codebases;

/**
 * Answers of `getSecurityOverview` and `getSecurityOverviewCodebases` recorded on the testbed by
 * packages/trpc/scripts/record-overview-fixtures.ts, checked against the schemas of the procedures.
 */
export function recordedRuntime(state: keyof typeof testbed.runtime): SecurityOverview {
  return securityOverviewSchema.parse(testbed.runtime[state].output);
}

export function recordedCodebases(state: RecordedState): SecurityOverviewCodebases {
  return securityOverviewCodebasesSchema.parse(testbed.codebases[state].output);
}

/** Both parts as recorded for `state`. */
export function recordedAnswers(state: RecordedState): OverviewAnswers {
  const codebases = recordedCodebases(state);

  return state === "mitigated" ? { state, codebases } : { state, runtime: recordedRuntime(state), codebases };
}

/** Both parts as recorded for DefectDojo not configured, and for DefectDojo that refuses the connection. */
export function recordedOutage(outage: "notConfigured" | "unreachable"): OverviewAnswers {
  return {
    runtime: securityOverviewSchema.parse(testbed[outage].runtime.output),
    codebases: securityOverviewCodebasesSchema.parse(testbed[outage].codebases.output),
  };
}

/** Seeds the answers of both procedures under the keys the page reads for `state`. */
export function seedOverview({ state = "active", runtime, codebases }: OverviewAnswers) {
  return (queryClient: QueryClient) => {
    if (runtime && isRuntimeFindingState(state)) {
      queryClient.setQueryData(securityOverviewKey({ namespace: OVERVIEW_NAMESPACE, state }), runtime);
    }
    queryClient.setQueryData(securityOverviewCodebasesKey({ namespace: OVERVIEW_NAMESPACE, state }), codebases);
  };
}
