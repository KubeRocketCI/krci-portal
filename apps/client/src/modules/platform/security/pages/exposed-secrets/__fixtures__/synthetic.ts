// SYNTHETIC data: derived from the recording of the testbed, not recorded from it. Only for states the testbed does not
// hold.
import {
  PLATFORM_LIST_DEFAULT_PAGE_SIZE,
  TRIAGED_RUNTIME_SCAN_LIMIT,
  type PlatformFinding,
  type PlatformFindingsList,
} from "@my-project/shared";
import { recordedList, recordedPage, type RecordedList, type RecordedPage, type Scenario } from "./seed";

export const SYNTHETIC_TRIAGED_TOTAL = TRIAGED_RUNTIME_SCAN_LIMIT;

/** The total of the Code list: two full pages and part of a third. */
export const SYNTHETIC_CODE_TOTAL = 2 * PLATFORM_LIST_DEFAULT_PAGE_SIZE + 5;

type ListData = Extract<PlatformFindingsList, { state: "data" }>;

function recordedData(scenario: Scenario): { list: RecordedList; output: ListData; template: PlatformFinding } {
  const list = recordedList(scenario);
  const { output } = list;
  if (output.state !== "data" || output.findings.length === 0) {
    throw new Error(`The recording of ${scenario} holds no finding`);
  }
  return { list, output, template: output.findings[0] };
}

/** A full page of copies of a recorded finding, each with its own title and link. */
function pageOf(template: PlatformFinding, name: string): PlatformFinding[] {
  return Array.from({ length: PLATFORM_LIST_DEFAULT_PAGE_SIZE }, (_, index) => ({
    ...template,
    title: `Synthetic ${name} rule ${index}`,
    url: `https://defectdojo.example.test/finding/synthetic-${name}-${index}`,
  }));
}

/**
 * The false positive Runtime list as the server answers when DefectDojo holds more triaged findings than
 * `TRIAGED_RUNTIME_SCAN_LIMIT`: a full page of the recorded false positive, and `truncated`.
 */
export function syntheticTruncatedTriaged(): RecordedPage {
  const { list, output, template } = recordedData("runtimeTriaged");

  return {
    ...recordedPage({ code: "codeTriaged", runtime: "runtimeTriaged" }),
    runtime: {
      ...list,
      output: { ...output, total: SYNTHETIC_TRIAGED_TOTAL, findings: pageOf(template, "runtime"), truncated: true },
    },
  };
}

/** The default Runtime list when no secret is active: the scan data exists and every finding is triaged. */
export function syntheticRuntimeNoActiveFindings(): RecordedPage {
  const { list, output } = recordedData("runtimeDefault");

  return {
    ...recordedPage({ code: "codeDefault", runtime: "runtimeDefault" }),
    runtime: { ...list, output: { ...output, total: 0, findings: [] } },
  };
}

/** The second page of a Code list with more findings than a page holds; the Runtime list as recorded. */
export function syntheticCodeSecondPage(): RecordedPage {
  const { list, output, template } = recordedData("codeDefault");

  return {
    ...recordedPage({ code: "codeDefault", runtime: "runtimeDefault" }),
    code: {
      input: { ...list.input, page: 1 },
      output: { ...output, total: SYNTHETIC_CODE_TOTAL, findings: pageOf(template, "code") },
    },
  };
}
