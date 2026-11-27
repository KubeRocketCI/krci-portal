import type { QueryClient } from "@tanstack/react-query";
import { environmentSummarySchema, type EnvironmentSummary, type EnvironmentSummaryInput } from "@my-project/shared";
import { withAppProviders } from "@sb/index";
import { environmentSummaryKey } from "../hooks/useEnvironmentSummary";
import testbed from "./testbed.json";

export const CODEBASE = testbed.stages["demo/dev"].output.applications[0].codebase;

export type RecordedStage = keyof typeof testbed.stages;

export interface Answer {
  input: EnvironmentSummaryInput;
  summary: EnvironmentSummary;
}

/**
 * The answer of `getEnvironmentSummary` for a Stage of CDPipeline demo, recorded on the testbed by
 * packages/trpc/scripts/record-stage-fixtures.ts, checked against the schema of the procedure.
 */
export function recorded(stage: RecordedStage): Answer {
  const { input, output } = testbed.stages[stage];
  return { input, summary: environmentSummarySchema.parse(output) };
}

/** The answers recorded for demo / dev with DefectDojo not configured, and with DefectDojo refusing the connection. */
export function recordedOutage(outage: "notConfigured" | "unreachable"): Answer {
  const { input, output } = testbed[outage];
  return { input, summary: environmentSummarySchema.parse(output) };
}

/**
 * Seeds the answer under the key both tabs of the Stage page read. An answer that is not "data" is stale at once and
 * asked again on mount; in Storybook that request fails and the seeded answer stays.
 */
export const seedEnvironmentSummary =
  ({ input, summary }: Answer) =>
  (queryClient: QueryClient) => {
    queryClient.setQueryData(environmentSummaryKey(input), summary);
  };

export const seededStory = (answer: Answer) => ({
  args: { environment: answer.input },
  decorators: [withAppProviders({ seedQueryCache: seedEnvironmentSummary(answer) })],
});
