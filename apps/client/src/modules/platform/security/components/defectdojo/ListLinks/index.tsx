import type { DefectDojoFindingState, DefectDojoSeverity, NamespacePlace } from "@my-project/shared";
import { KeyRound, ShieldAlert } from "lucide-react";
import { CellLink } from "@/core/components/Table/components/CellLink";
import {
  PATH_EXPOSED_SECRETS_FULL,
  type Search as ExposedSecretsSearch,
} from "@/modules/platform/security/pages/exposed-secrets/route";
import {
  PATH_VULNERABILITIES_FULL,
  type Search as VulnerabilitiesSearch,
} from "@/modules/platform/security/pages/vulnerabilities/route";
import { namespaceListSearch } from "../searchParams";
import { labelledLinkProps, placeLabel } from "../utils";

export interface ListLinkProps<Search> {
  clusterName: string;
  search: Search;
  /** Names what the list shows: "Vulnerabilities of in-cluster / demo-dev". */
  label: string;
  /** Without it the link is an icon. */
  text?: string;
}

export function VulnerabilitiesLink({ clusterName, search, label, text }: ListLinkProps<VulnerabilitiesSearch>) {
  return (
    <CellLink
      to={PATH_VULNERABILITIES_FULL}
      params={{ clusterName }}
      search={search}
      icon={ShieldAlert}
      {...labelledLinkProps(label, text)}
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
      {...labelledLinkProps(label, text)}
    />
  );
}

export interface NamespaceListLinkProps {
  place: NamespacePlace;
  clusterName: string;
  filters?: { severity?: DefectDojoSeverity; state?: DefectDojoFindingState };
  /** Without it the link is an icon. */
  text?: string;
}

export function NamespaceVulnerabilitiesLink({ place, clusterName, filters, text }: NamespaceListLinkProps) {
  return (
    <VulnerabilitiesLink
      clusterName={clusterName}
      search={{ level: "runtime", ...namespaceListSearch(place, filters) }}
      label={`Vulnerabilities of ${placeLabel(place)}`}
      text={text}
    />
  );
}

export function NamespaceExposedSecretsLink({ place, clusterName, filters, text }: NamespaceListLinkProps) {
  return (
    <ExposedSecretsLink
      clusterName={clusterName}
      search={namespaceListSearch(place, filters)}
      label={`Exposed secrets of ${placeLabel(place)}`}
      text={text}
    />
  );
}
