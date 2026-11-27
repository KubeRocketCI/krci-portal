import type { QueryClient } from "@tanstack/react-query";
import { codebaseSecurityLineSchema, type CodebaseFindingsInput, type CodebaseSecurityLine } from "@my-project/shared";
import { withAppProviders } from "@sb/index";
import { codebaseSecurityLineKey } from "../hooks/useCodebaseSecurityLine";
import testbed from "./testbed.json";

/** Namespace of the codebases the fixtures were recorded for. */
export const TESTBED_NAMESPACE = "krci";

export type RecordedCodebase = keyof typeof testbed.codebases;

export interface Answer {
  input: CodebaseFindingsInput;
  line: CodebaseSecurityLine;
}

/**
 * The answer of `getCodebaseSecurityLine` for a Codebase of `TESTBED_NAMESPACE`, recorded on the testbed by
 * packages/trpc/scripts/record-codebase-line-fixtures.ts, checked against the schema of the procedure.
 */
export function recorded(name: RecordedCodebase): Answer {
  return {
    input: { namespace: TESTBED_NAMESPACE, name },
    line: codebaseSecurityLineSchema.parse(testbed.codebases[name]),
  };
}

/**
 * The answer recorded with DefectDojo not configured, or refusing the connection. It names no codebase, so it serves
 * any `name`.
 */
export function recordedOutage(outage: "notConfigured" | "unreachable", name: RecordedCodebase): Answer {
  return { input: { namespace: TESTBED_NAMESPACE, name }, line: codebaseSecurityLineSchema.parse(testbed[outage]) };
}

/**
 * An answer that is not "data" is stale at once and asked again on mount; in Storybook that request fails and the
 * seeded answer stays.
 */
export const seedSecurityLine =
  ({ input, line }: Answer) =>
  (queryClient: QueryClient) => {
    queryClient.setQueryData(codebaseSecurityLineKey(input), line);
  };

export const seededStory = (answer: Answer) => ({
  args: { codebase: answer.input },
  decorators: [withAppProviders({ seedQueryCache: seedSecurityLine(answer) })],
});
