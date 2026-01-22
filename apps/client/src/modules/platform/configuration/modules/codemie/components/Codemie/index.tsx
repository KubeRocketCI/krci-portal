import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useCodemieWatchItem } from "@/k8s/api/groups/KRCI/Codemie";
import { useCodemieProjectWatchItem } from "@/k8s/api/groups/KRCI/CodemieProject";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useClusterStore } from "@/k8s/store";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useShallow } from "zustand/react/shallow";
import { ManageCodeMie } from "../ManageCodeMie";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import { useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { getCodemieStatusIcon } from "@/k8s/api/groups/KRCI/Codemie/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import type { UsePermissionsResult } from "@/k8s/api/hooks/hook-creators/types";

const extraInfoLink = EDP_USER_GUIDE.ADD_AI_ASSISTANT.url;

export const CodemieSection = ({
  handleOpenCreateDialog,
  handleCloseCreateDialog,
  secretPermissions,
}: {
  handleOpenCreateDialog: () => void;
  handleCloseCreateDialog: () => void;
  secretPermissions: UsePermissionsResult;
}) => {
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  const codemieWatch = useCodemieWatchItem({
    name: "codemie",
  });
  const codemie = codemieWatch.query.data;

  const codemieProjectWatch = useCodemieProjectWatchItem({
    name: namespace,
  });
  const codemieProject = codemieProjectWatch.query.data;

  const codemieQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.codemie,
  });
  const codemieQuickLink = codemieQuickLinkWatch.query.data;

  const codemieSecretWatch = useSecretWatchItem({
    name: integrationSecretName.CODEMIE,
  });
  const codemieSecret = codemieSecretWatch.query.data;

  const error = codemieWatch.query.error || codemieSecretWatch.query.error || codemieProjectWatch.query.error;
  const isLoading = !codemieWatch.isReady || !codemieSecretWatch.isReady || !codemieProjectWatch.isReady;

  const forbiddenError = error && getForbiddenError(error);
  if (forbiddenError) {
    return <ErrorContent error={forbiddenError} extraInfoLink={extraInfoLink} outlined />;
  }

  if (codemieWatch.query.error) {
    return <ErrorContent error={codemieWatch.query.error} extraInfoLink={extraInfoLink} outlined />;
  }

  if (codemieSecretWatch.query.error) {
    return <ErrorContent error={codemieSecretWatch.query.error} extraInfoLink={extraInfoLink} outlined />;
  }

  if (codemieProjectWatch.query.error) {
    return <ErrorContent error={codemieProjectWatch.query.error} extraInfoLink={extraInfoLink} outlined />;
  }

  if (!codemieWatch.isReady && !codemieSecretWatch.isReady && !codemieProjectWatch.isReady) {
    if (!secretPermissions.data.create.allowed) {
      return (
        <EmptyList customText={"No CodeMie integration found."} beforeLinkText={secretPermissions.data.create.reason} />
      );
    }

    return (
      <EmptyList
        customText={"No CodeMie integration found."}
        linkText={"Click here to add integration."}
        handleClick={handleOpenCreateDialog}
      />
    );
  }

  const ownerReference = codemieSecret?.metadata?.ownerReferences?.[0]?.kind;

  const status = codemieProject?.status?.value;
  const statusError = codemieProject?.status?.error;

  const statusIcon = getCodemieStatusIcon(codemie);

  return (
    <LoadingWrapper isLoading={isLoading}>
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className="cursor-default">
            <h6 className="text-base font-medium">
              <div className="flex items-center gap-2">
                <div className="mr-1">
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
                        {!!statusError && <p className="mt-3 text-sm font-medium">{statusError}</p>}
                      </>
                    }
                  />
                </div>
                <div>{codemieProject?.metadata.name}</div>
                {!!ownerReference && (
                  <div>
                    <Tooltip title={`Managed by ${ownerReference}`}>
                      <ShieldX size={16} />
                    </Tooltip>
                  </div>
                )}
              </div>
            </h6>
          </AccordionTrigger>
          <AccordionContent>
            <ManageCodeMie
              quickLink={codemieQuickLink!}
              codemie={codemie!}
              codemieSecret={codemieSecret!}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </LoadingWrapper>
  );
};
