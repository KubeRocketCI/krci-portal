// PROTOTYPE ONLY (EPMDEDP-16072). Not for main.
// The operator will write the report kind of a Runtime test as the test tag `report-kind:<kind>`.
// Until it does, this module is the single place that reads the kind from a title.
import { PROTOTYPE_DEFECTDOJO_REPORT_KINDS, PROTOTYPE_DEFECTDOJO_TAG_KEY } from "./constants.js";

export type PrototypeDefectDojoReportKind = (typeof PROTOTYPE_DEFECTDOJO_REPORT_KINDS)[number];

/**
 * Report kind of a Runtime test: the value of its `report-kind` tag, else the first word of its
 * title (`<ReportKind> <kind>/<name>/<container>`). `null` when neither names a known kind.
 */
export function prototypeRuntimeReportKind(test: {
  title: string;
  tags: string[];
}): PrototypeDefectDojoReportKind | null {
  const tagPrefix = `${PROTOTYPE_DEFECTDOJO_TAG_KEY.reportKind}:`;
  const tagValue = test.tags.find((tag) => tag.startsWith(tagPrefix))?.slice(tagPrefix.length);

  for (const kind of PROTOTYPE_DEFECTDOJO_REPORT_KINDS) {
    if (tagValue === kind.toLowerCase() || test.title.startsWith(`${kind} `)) {
      return kind;
    }
  }
  return null;
}

/**
 * Title filter (`title` is "contains" in API v2) that selects the findings of ExposedSecretReport
 * tests across products. Stands in for `test__tags=report-kind:exposedsecretreport`.
 */
export const PROTOTYPE_RUNTIME_SECRET_FINDING_TITLE = "Secret detected in";
