import type { OverviewNamespace, OverviewScan } from "@my-project/shared";
import { KeyRound, ShieldAlert } from "lucide-react";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { placeLabel } from "@/modules/platform/security/components/defectdojo/utils";
import {
  PATH_EXPOSED_SECRETS_FULL,
  type Search as ExposedSecretsSearch,
} from "@/modules/platform/security/pages/exposed-secrets/route";
import {
  PATH_VULNERABILITIES_FULL,
  type Search as VulnerabilitiesSearch,
} from "@/modules/platform/security/pages/vulnerabilities/route";
import { namespaceListSearch, type LinkContext } from "../../utils/links";
import { isSecretScanType } from "../../utils/model";

interface ListLinkProps<Search> {
  clusterName: string;
  search: Search;
  /** Names what the list shows: "Vulnerabilities of in-cluster / demo-dev". */
  label: string;
  /** Without it the link is an icon. */
  text?: string;
}

/** What the two list links share: their name, and the icon alone without `text`. */
function linkProps(label: string, text: string | undefined) {
  return { text: text ?? label, iconOnly: text === undefined, "aria-label": label, title: label, className: "w-auto" };
}

export function VulnerabilitiesLink({ clusterName, search, label, text }: ListLinkProps<VulnerabilitiesSearch>) {
  return (
    <CellLink
      to={PATH_VULNERABILITIES_FULL}
      params={{ clusterName }}
      search={search}
      icon={ShieldAlert}
      {...linkProps(label, text)}
    />
  );
}

export function ExposedSecretsLink({ clusterName, search, label, text }: ListLinkProps<ExposedSecretsSearch>) {
  return (
    <CellLink
      to={PATH_EXPOSED_SECRETS_FULL}
      params={{ clusterName }}
      search={search}
      icon={KeyRound}
      {...linkProps(label, text)}
    />
  );
}

export interface NamespaceVulnerabilitiesLinkProps {
  row: Pick<OverviewNamespace, "cluster" | "namespace">;
  links: LinkContext;
  /** Without it the link is an icon. */
  text?: string;
}

/** Opens the Runtime vulnerabilities of one namespace of one cluster. */
export function NamespaceVulnerabilitiesLink({ row, links, text }: NamespaceVulnerabilitiesLinkProps) {
  return (
    <VulnerabilitiesLink
      clusterName={links.clusterName}
      search={{ level: "runtime", ...namespaceListSearch(row, links) }}
      label={`Vulnerabilities of ${placeLabel(row)}`}
      text={text}
    />
  );
}

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
