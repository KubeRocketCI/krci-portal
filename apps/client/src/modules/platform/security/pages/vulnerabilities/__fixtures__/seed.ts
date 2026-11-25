import type { QueryClient } from "@tanstack/react-query";
import {
  findingsScopeSchema,
  k8sCodebaseConfig,
  vulnerabilitiesInputSchema,
  vulnerabilitiesSchema,
  type FindingsScope,
  type Vulnerabilities,
  type VulnerabilitiesRequest,
} from "@my-project/shared";
import { getK8sWatchListQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";
import { TEST_CLUSTER_NAME } from "@/test/utils";
import { findingsScopeKey } from "../hooks/useFindingsScope";
import { vulnerabilitiesKey } from "../hooks/useVulnerabilities";
import testbed from "./testbed.json";

export const TESTBED_NAMESPACE = testbed.lists.runtimeDefault.input.namespace;

export type ListScenario = keyof typeof testbed.lists;

export interface RecordedPage {
  scope: FindingsScope;
  list: { input: VulnerabilitiesRequest; output: Vulnerabilities };
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
      output: vulnerabilitiesSchema.parse(recorded.list.output),
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

function codebaseWatchList(codebases: string[]) {
  const items = new Map(
    codebases.map((name) => [
      name,
      {
        apiVersion: k8sCodebaseConfig.apiVersion,
        kind: k8sCodebaseConfig.kind,
        metadata: { name, namespace: TESTBED_NAMESPACE },
        spec: {},
      },
    ])
  );

  return { apiVersion: k8sCodebaseConfig.apiVersion, kind: `${k8sCodebaseConfig.kind}List`, metadata: {}, items };
}

export function seedPage({ scope, list, codebases }: RecordedPage) {
  return (queryClient: QueryClient) => {
    queryClient.setQueryData(findingsScopeKey({ namespace: TESTBED_NAMESPACE }), scope);
    queryClient.setQueryData(vulnerabilitiesKey(list.input), list.output);
    queryClient.setQueryData(
      getK8sWatchListQueryCacheKey(
        TEST_CLUSTER_NAME,
        TESTBED_NAMESPACE,
        k8sCodebaseConfig.group,
        k8sCodebaseConfig.pluralName
      ),
      codebaseWatchList(codebases)
    );
  };
}
