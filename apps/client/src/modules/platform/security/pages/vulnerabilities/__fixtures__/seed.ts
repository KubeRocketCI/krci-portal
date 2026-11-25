import type { QueryClient } from "@tanstack/react-query";
import {
  findingsScopeSchema,
  platformFindingsListSchema,
  vulnerabilitiesInputSchema,
  type FindingsScope,
  type PlatformFindingsList,
  type VulnerabilitiesRequest,
} from "@my-project/shared";
import { seedFilterData } from "@/modules/platform/security/components/defectdojo/__fixtures__/seedFilters";
import { vulnerabilitiesKey } from "../hooks/useVulnerabilities";
import testbed from "./testbed.json";

export const TESTBED_NAMESPACE = testbed.lists.runtimeDefault.input.namespace;

export type ListScenario = keyof typeof testbed.lists;

export interface RecordedPage {
  scope: FindingsScope;
  list: { input: VulnerabilitiesRequest; output: PlatformFindingsList };
  codebases: string[];
}

function parsed(recorded: {
  scope: unknown;
  list: { input: unknown; output: unknown };
}): Omit<RecordedPage, "codebases"> {
  return {
    scope: findingsScopeSchema.parse(recorded.scope),
    list: {
      input: vulnerabilitiesInputSchema.parse(recorded.list.input),
      output: platformFindingsListSchema.parse(recorded.list.output),
    },
  };
}

/**
 * Answers of `getFindingsScope` and `getVulnerabilities` recorded on the testbed by
 * packages/trpc/scripts/record-vulnerabilities-fixtures.ts, checked against the schemas of the procedures.
 */
export function recordedPage(scenario: ListScenario): RecordedPage {
  return { ...parsed({ scope: testbed.scope, list: testbed.lists[scenario] }), codebases: testbed.codebases };
}

export function recordedUnavailable(state: "notConfigured" | "unreachable"): RecordedPage {
  return { ...parsed(testbed[state]), codebases: [] };
}

export function seedPage({ scope, list, codebases }: RecordedPage) {
  return (queryClient: QueryClient) => {
    seedFilterData(queryClient, { namespace: TESTBED_NAMESPACE, scope, codebases });
    queryClient.setQueryData(vulnerabilitiesKey(list.input), list.output);
  };
}
