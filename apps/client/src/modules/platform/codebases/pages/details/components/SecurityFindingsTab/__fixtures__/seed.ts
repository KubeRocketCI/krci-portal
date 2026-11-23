import type { QueryClient } from "@tanstack/react-query";
import {
  codebaseFindingsSchema,
  scanFindingsInputSchema,
  scanFindingsSchema,
  type CodebaseFindings,
  type ScanFindings,
  type ScanFindingsInput,
} from "@my-project/shared";
import { codebaseFindingsKey } from "../hooks/useCodebaseFindings";
import { scanFindingsKey } from "../hooks/useScanFindings";
import testbed from "./testbed.json";

/** Namespace of the codebases the fixtures were recorded for. */
export const TESTBED_NAMESPACE = "krci";

/** A codebase of the testbed: the summary of its scans, and the pages of findings that a row opens. */
export interface RecordedCodebase {
  summary: CodebaseFindings;
  scanFindings: { input: ScanFindingsInput; output: ScanFindings }[];
}

/**
 * Answers of `getCodebaseFindings` and `getScanFindings` recorded on the testbed by
 * packages/trpc/scripts/record-codebase-findings-fixtures.ts, checked against the schemas of the procedures.
 */
export function recordedCodebase(scenario: keyof typeof testbed): RecordedCodebase {
  const { summary, scanFindings } = testbed[scenario];

  return {
    summary: codebaseFindingsSchema.parse(summary),
    scanFindings: scanFindings.map(({ input, output }) => ({
      input: scanFindingsInputSchema.parse(input),
      output: scanFindingsSchema.parse(output),
    })),
  };
}

/** Puts the recorded answers in the query cache under the keys of the hooks. */
export function seedCodebaseFindings(codebaseName: string, recorded: RecordedCodebase) {
  return (queryClient: QueryClient) => {
    queryClient.setQueryData(
      codebaseFindingsKey({ namespace: TESTBED_NAMESPACE, name: codebaseName }),
      recorded.summary
    );
    for (const { input, output } of recorded.scanFindings) {
      queryClient.setQueryData(scanFindingsKey(input), output);
    }
  };
}
