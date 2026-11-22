// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Three variants of the codebase "Security Findings" tab, switchable via `?variant=A|B|C`
// on the existing codebase details route. Data: DefectDojo through the `prototypeDefectDojo` router.
// `?cdPipeline=<name>&stage=<name>` puts the Runtime findings of that Environment in focus.
import React from "react";
import { Alert } from "@/core/components/ui/alert";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { router } from "@/core/router";
import { PrototypeVariantSwitcher } from "@/modules/platform/security/prototype-defectdojo/components/PrototypeVariantSwitcher";
import { PATH_PROJECT_DETAILS_FULL, routeProjectDetails } from "../../route";
import { CodebaseFindingsVariant } from "./CodebaseFindingsVariant";
import { CODEBASE_FINDINGS_VARIANTS, DEFAULT_CODEBASE_FINDINGS_VARIANT } from "./constants";
import { useCodebaseFindingsScope } from "./hooks/useCodebaseFindingsScope";
import { isFocusedEnvironment } from "./model";
import type { CodebaseFindingsVariantKey, EnvironmentFocus } from "./types";

export function PrototypeSecurityFindingsTab() {
  const params = routeProjectDetails.useParams();
  const search = routeProjectDetails.useSearch();
  const variant = search.variant ?? DEFAULT_CODEBASE_FINDINGS_VARIANT;

  const { scope, isLoading } = useCodebaseFindingsScope();

  const focus = React.useMemo<EnvironmentFocus | null>(
    () => (search.cdPipeline && search.stage ? { cdPipeline: search.cdPipeline, stage: search.stage } : null),
    [search.cdPipeline, search.stage]
  );
  const focusFound = scope.environments.some((environment) => isFocusedEnvironment(environment, focus));

  const handleVariantChange = React.useCallback(
    (key: CodebaseFindingsVariantKey) => {
      void router.navigate({
        to: PATH_PROJECT_DETAILS_FULL,
        params,
        search: (previous) => ({ ...previous, variant: key }),
        replace: true,
      });
    },
    [params]
  );

  return (
    <div className="space-y-4">
      {focus && !isLoading && (
        <Alert>
          {focusFound
            ? `Opened from Environment ${focus.cdPipeline} / ${focus.stage}: its Runtime findings are in focus.`
            : `Environment ${focus.cdPipeline} / ${focus.stage} does not deploy this codebase.`}
        </Alert>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <LoadingSpinner />
        </div>
      ) : (
        <CodebaseFindingsVariant variant={variant} scope={scope} focus={focus} />
      )}
      <PrototypeVariantSwitcher
        variants={CODEBASE_FINDINGS_VARIANTS}
        current={variant}
        onChange={handleVariantChange}
      />
    </div>
  );
}
