import type { ReactNode } from "react";
import { DEFECTDOJO_LEVEL_SCAN_TYPES, TRIAGED_RUNTIME_SCAN_LIMIT, type SeverityCounts } from "@my-project/shared";
import { CardLineRow } from "../CardLineRow";

export interface RuntimeLinesProps {
  vulnerabilities: Readonly<SeverityCounts>;
  secrets: Readonly<SeverityCounts>;
  secretsTruncated: boolean;
  /** What the lines add up, after the scan type: "4 namespaces". */
  scope?: string;
  /** Open the lists the lines count. */
  vulnerabilitiesLink: ReactNode;
  secretsLink: ReactNode;
}

/** The vulnerabilities and, apart, the exposed secrets of the security operator's scans: never added. */
export function RuntimeLines({
  vulnerabilities,
  secrets,
  secretsTruncated,
  scope,
  vulnerabilitiesLink,
  secretsLink,
}: RuntimeLinesProps) {
  const detail = [DEFECTDOJO_LEVEL_SCAN_TYPES.runtime.join(", "), scope].filter(Boolean).join(", ");

  return (
    <>
      <CardLineRow name="Vulnerabilities" detail={detail} counts={vulnerabilities} link={vulnerabilitiesLink} />
      <CardLineRow name="Exposed secrets" detail={detail} counts={secrets} link={secretsLink} />
      {secretsTruncated && (
        <p className="text-muted-foreground text-xs">
          More than {TRIAGED_RUNTIME_SCAN_LIMIT} exposed secrets: the ones past that count as vulnerabilities.
        </p>
      )}
    </>
  );
}
