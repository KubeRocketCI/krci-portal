import type { QueryClient } from "@tanstack/react-query";
import {
  exposedSecretsInputSchema,
  findingsScopeSchema,
  platformFindingsListSchema,
  type ExposedSecretsRequest,
  type FindingsScope,
  type PlatformFindingsList,
} from "@my-project/shared";
import { seedFilterData } from "@/modules/platform/security/components/defectdojo/__fixtures__/seedFilters";
import { exposedSecretsKey } from "../hooks/useExposedSecrets";
import testbed from "./testbed.json";

export const TESTBED_NAMESPACE = testbed.lists.codeDefault.input.namespace;

type Lists = typeof testbed.lists;

export type CodeScenario = Extract<keyof Lists, `code${string}`>;
export type RuntimeScenario = Extract<keyof Lists, `runtime${string}`>;
export type Scenario = CodeScenario | RuntimeScenario;

export interface RecordedList {
  input: ExposedSecretsRequest;
  output: PlatformFindingsList;
}

export interface RecordedPage {
  scope: FindingsScope;
  code: RecordedList;
  /** `null`: the page sends no Runtime request, as under the Mitigated state. */
  runtime: RecordedList | null;
  codebases: string[];
}

function parsedList(recorded: { input: unknown; output: unknown }): RecordedList {
  return {
    input: exposedSecretsInputSchema.parse(recorded.input),
    output: platformFindingsListSchema.parse(recorded.output),
  };
}

/**
 * One list as `getExposedSecrets` answered it, recorded on the testbed by
 * packages/trpc/scripts/record-exposed-secrets-fixtures.ts, checked against the schemas of the procedure.
 */
export function recordedList(scenario: Scenario): RecordedList {
  return parsedList(testbed.lists[scenario]);
}

export function recordedPage(scenarios: { code: CodeScenario; runtime: RuntimeScenario | null }): RecordedPage {
  return {
    scope: findingsScopeSchema.parse(testbed.scope),
    code: recordedList(scenarios.code),
    runtime: scenarios.runtime && recordedList(scenarios.runtime),
    codebases: testbed.codebases,
  };
}

export function recordedUnavailable(state: "notConfigured" | "unreachable"): RecordedPage {
  const recorded = testbed[state];

  return {
    scope: findingsScopeSchema.parse(recorded.scope),
    code: parsedList(recorded.code),
    runtime: parsedList(recorded.runtime),
    codebases: [],
  };
}

export function seedPage({ scope, code, runtime, codebases }: RecordedPage) {
  return (queryClient: QueryClient) => {
    seedFilterData(queryClient, { namespace: TESTBED_NAMESPACE, scope, codebases });
    queryClient.setQueryData(exposedSecretsKey(code.input), code.output);
    if (runtime) {
      queryClient.setQueryData(exposedSecretsKey(runtime.input), runtime.output);
    }
  };
}
