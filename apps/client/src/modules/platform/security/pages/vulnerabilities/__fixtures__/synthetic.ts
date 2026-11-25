// SYNTHETIC data: derived from the recording of the testbed, not recorded from it. Only for states the testbed does not
// hold.
import {
  TRIAGED_RUNTIME_SCAN_LIMIT,
  VULNERABILITIES_DEFAULT_PAGE_SIZE,
  type PlatformFinding,
} from "@my-project/shared";
import { recordedPage, type RecordedPage } from "./seed";

export const SYNTHETIC_TRIAGED_TOTAL = TRIAGED_RUNTIME_SCAN_LIMIT;

/**
 * The false positive Runtime list as the server answers when DefectDojo holds more triaged findings than
 * `TRIAGED_RUNTIME_SCAN_LIMIT`: a full page of the recorded false positive, and `truncated`.
 */
export function syntheticTruncatedTriaged(): RecordedPage {
  const recorded = recordedPage("runtimeFalsePositive");
  const { output } = recorded.list;
  if (output.state !== "data" || output.findings.length === 0) {
    throw new Error("The recording holds no false positive Runtime finding");
  }

  const [template] = output.findings;
  const findings = Array.from({ length: VULNERABILITIES_DEFAULT_PAGE_SIZE }, (_, index): PlatformFinding => {
    const id = `CVE-2098-${String(index).padStart(5, "0")}`;

    return {
      ...template,
      title: `${id} Synthetic-PKG ${index}`,
      vulnerabilityIds: [id],
      url: `https://defectdojo.example.test/finding/synthetic-${index}`,
    };
  });

  return {
    ...recorded,
    list: { ...recorded.list, output: { ...output, total: SYNTHETIC_TRIAGED_TOTAL, findings, truncated: true } },
  };
}

/** The default Runtime list when no vulnerability is active: the scan data exists and every finding is triaged. */
export function syntheticNoActiveFindings(): RecordedPage {
  const recorded = recordedPage("runtimeDefault");
  const { output } = recorded.list;
  if (output.state !== "data") {
    throw new Error("The recording of the default Runtime list holds no data");
  }

  return { ...recorded, list: { ...recorded.list, output: { ...output, total: 0, findings: [] } } };
}
