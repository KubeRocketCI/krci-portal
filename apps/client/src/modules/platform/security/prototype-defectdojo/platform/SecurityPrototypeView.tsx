// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeDefectDojoApi } from "../api/context";
import { PrototypeDefectDojoProvider } from "../api/provider";
import { ExposedSecretsList } from "./lists/ExposedSecretsList";
import { VulnerabilitiesList } from "./lists/VulnerabilitiesList";
import { OverviewVariantA } from "./overview/VariantA";
import { OverviewVariantB } from "./overview/VariantB";
import { OverviewVariantC } from "./overview/VariantC";
import type { SecurityOverviewVariantKey, SecurityPageProps } from "./types";

/** The three Security pages that read DefectDojo. */
export type SecurityPrototypePage = "overview" | "vulnerabilities" | "secrets";

export interface SecurityPrototypeViewProps extends SecurityPageProps {
  page: SecurityPrototypePage;
  /** Variant of the overview. The two list pages have one layout. */
  variant: SecurityOverviewVariantKey;
  /** Default: the tRPC client. Stories pass a fixture-backed API. */
  api?: PrototypeDefectDojoApi;
}

/** Content of a Security page on DefectDojo. Each page and variant has its own query cache scope and request log. */
export function SecurityPrototypeView({ page, variant, api, ...props }: SecurityPrototypeViewProps) {
  const cacheScope = page === "overview" ? `security-overview-${variant}` : `security-${page}`;

  return (
    <PrototypeDefectDojoProvider key={cacheScope} api={api} cacheScope={cacheScope}>
      {page === "overview" && variant === "A" && <OverviewVariantA {...props} />}
      {page === "overview" && variant === "B" && <OverviewVariantB {...props} />}
      {page === "overview" && variant === "C" && <OverviewVariantC {...props} />}
      {page === "vulnerabilities" && <VulnerabilitiesList {...props} />}
      {page === "secrets" && <ExposedSecretsList {...props} />}
    </PrototypeDefectDojoProvider>
  );
}
