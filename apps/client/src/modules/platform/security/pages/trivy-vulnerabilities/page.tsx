import { router } from "@/core/router";
import { SECURITY_LIST_VARIANTS } from "@/modules/platform/security/prototype-defectdojo/platform/constants";
import { PrototypeSecurityHost } from "@/modules/platform/security/prototype-defectdojo/platform/PrototypeSecurityHost";
import { PATH_TRIVY_VULNERABILITIES_FULL, routeTrivyVulnerabilities } from "./route";
import TrivyVulnerabilitiesPageContent from "./view";

// PROTOTYPE (EPMDEDP-16072): `?variant=A` renders the DefectDojo list. Not for main.
export default function TrivyVulnerabilitiesPage() {
  const params = routeTrivyVulnerabilities.useParams();
  const search = routeTrivyVulnerabilities.useSearch();

  return (
    <PrototypeSecurityHost
      page="vulnerabilities"
      variants={SECURITY_LIST_VARIANTS}
      variant={search.variant}
      clusters={search.clusters}
      namespace={search.namespace}
      onSearchChange={(patch) =>
        void router.navigate({
          to: PATH_TRIVY_VULNERABILITIES_FULL,
          params,
          search: (previous) => ({ ...previous, ...patch }),
          replace: true,
        })
      }
    >
      <TrivyVulnerabilitiesPageContent />
    </PrototypeSecurityHost>
  );
}
