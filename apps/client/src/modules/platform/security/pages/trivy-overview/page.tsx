import { router } from "@/core/router";
import { SECURITY_OVERVIEW_VARIANTS } from "@/modules/platform/security/prototype-defectdojo/platform/constants";
import { PrototypeSecurityHost } from "@/modules/platform/security/prototype-defectdojo/platform/PrototypeSecurityHost";
import { PATH_TRIVY_OVERVIEW_FULL, routeTrivyOverview } from "./route";
import TrivyOverviewPageContent from "./view";

// PROTOTYPE (EPMDEDP-16072): `?variant=A|B|C` renders the DefectDojo overview. Not for main.
export default function TrivyOverviewPage() {
  const params = routeTrivyOverview.useParams();
  const search = routeTrivyOverview.useSearch();

  return (
    <PrototypeSecurityHost
      page="overview"
      variants={SECURITY_OVERVIEW_VARIANTS}
      variant={search.variant}
      clusters={search.clusters}
      onSearchChange={(patch) =>
        void router.navigate({
          to: PATH_TRIVY_OVERVIEW_FULL,
          params,
          search: (previous) => ({ ...previous, ...patch }),
          replace: true,
        })
      }
    >
      <TrivyOverviewPageContent />
    </PrototypeSecurityHost>
  );
}
