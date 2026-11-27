import type { OverviewScan } from "@my-project/shared";
import { ExposedSecretsLink, VulnerabilitiesLink } from "@/modules/platform/security/components/defectdojo/ListLinks";
import type { Search as VulnerabilitiesSearch } from "@/modules/platform/security/pages/vulnerabilities/route";
import { isSecretScanType } from "../../utils/model";

export interface ScanListLinkProps {
  clusterName: string;
  scanType: string;
  level: OverviewScan["ref"]["level"];
  /** The filters the list opens with: the codebase, the severity, the state. */
  search: Pick<VulnerabilitiesSearch, "codebase" | "severity" | "state">;
  label: string;
  text?: string;
}

/** Opens the list a scan type reports to: the exposed secrets of the code, or the vulnerabilities of its level. */
export function ScanListLink({ clusterName, scanType, level, search, label, text }: ScanListLinkProps) {
  return isSecretScanType(scanType) ? (
    <ExposedSecretsLink clusterName={clusterName} search={search} label={label} text={text} />
  ) : (
    <VulnerabilitiesLink clusterName={clusterName} search={{ level, ...search }} label={label} text={text} />
  );
}
