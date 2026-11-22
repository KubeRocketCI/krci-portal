import { router } from "@/core/router";
import { SECURITY_LIST_VARIANTS } from "@/modules/platform/security/prototype-defectdojo/platform/constants";
import { PrototypeSecurityHost } from "@/modules/platform/security/prototype-defectdojo/platform/PrototypeSecurityHost";
import { PATH_TRIVY_EXPOSED_SECRETS_FULL, routeTrivyExposedSecrets } from "./route";
import TrivyExposedSecretsPageContent from "./view";

// PROTOTYPE (EPMDEDP-16072): `?variant=A` renders the DefectDojo list. Not for main.
export default function TrivyExposedSecretsPage() {
  const params = routeTrivyExposedSecrets.useParams();
  const search = routeTrivyExposedSecrets.useSearch();

  return (
    <PrototypeSecurityHost
      page="secrets"
      variants={SECURITY_LIST_VARIANTS}
      variant={search.variant}
      clusters={search.clusters}
      onSearchChange={(patch) =>
        void router.navigate({
          to: PATH_TRIVY_EXPOSED_SECRETS_FULL,
          params,
          search: (previous) => ({ ...previous, ...patch }),
          replace: true,
        })
      }
    >
      <TrivyExposedSecretsPageContent />
    </PrototypeSecurityHost>
  );
}
