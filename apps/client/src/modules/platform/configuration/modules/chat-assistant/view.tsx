import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionSummary, AccordionDetails, Grid, Tooltip } from "@mui/material";
import { getIntegrationSecretStatus, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageChatAssistant } from "./components/ManageChatAssistant";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function ChatAssistantConfigurationPage() {
  const chatAssistantSecretWatch = useSecretWatchItem({
    name: "chat-assistant",
  });
  const chatAssistantSecret = chatAssistantSecretWatch.query.data;

  const chatAssistantQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.codemie,
  });
  const chatAssistantQuickLink = chatAssistantQuickLinkWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const quickLinkPermissions = useQuickLinkPermissions();

  const mode = chatAssistantSecret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const chatAssistantSecretError =
      chatAssistantSecretWatch.query.error && getForbiddenError(chatAssistantSecretWatch.query.error);
    const chatAssistantQuickLinkError =
      chatAssistantQuickLinkWatch.query.error && getForbiddenError(chatAssistantQuickLinkWatch.query.error);
    const isLoading = chatAssistantSecretWatch.query.isLoading || chatAssistantQuickLinkWatch.query.isLoading;

    if (chatAssistantSecretError || chatAssistantQuickLinkError) {
      return <ErrorContent error={chatAssistantSecretError || chatAssistantQuickLinkError} outlined />;
    }

    if (!chatAssistantSecret && !isLoading && !chatAssistantSecretError && !chatAssistantQuickLinkError) {
      return (
        <>
          <EmptyList
            customText={"No Chat Assistant integration secrets found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const ownerReference = chatAssistantSecret?.metadata?.ownerReferences?.[0]?.kind;

    const status = getIntegrationSecretStatus(chatAssistantSecret!);
    const statusIcon = getIntegrationSecretStatusIcon(chatAssistantSecret!);

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion expanded>
          <AccordionSummary style={{ cursor: "default" }}>
            <h6 className="text-base font-medium">
              <div className="flex gap-2 items-center">
                <div className="mr-1">
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <p className="text-sm font-semibold">
                          {`Connected: ${status.connected === undefined ? "Unknown" : status.connected}`}
                        </p>
                        {!!status.statusError && (
                          <p className="text-sm font-medium mt-3">
                            {status.statusError}
                          </p>
                        )}
                      </>
                    }
                  />
                </div>
                <div>{chatAssistantSecret?.metadata.name}</div>
                {!!ownerReference && (
                  <div>
                    <Tooltip title={`Managed by ${ownerReference}`}>
                      <ShieldX size={20} />
                    </Tooltip>
                  </div>
                )}
              </div>
            </h6>
          </AccordionSummary>
          <AccordionDetails>
            <ManageChatAssistant
              secret={chatAssistantSecret}
              quickLink={chatAssistantQuickLink}
              mode={mode}
              ownerReference={ownerReference}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    chatAssistantSecretWatch.query.error,
    chatAssistantSecretWatch.query.isLoading,
    chatAssistantQuickLinkWatch.query.error,
    chatAssistantQuickLinkWatch.query.isLoading,
    chatAssistantSecret,
    chatAssistantQuickLink,
    mode,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageChatAssistant
            secret={chatAssistantSecret}
            quickLink={chatAssistantQuickLink}
            mode={mode}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: chatAssistantSecretWatch.query.isLoading || !!chatAssistantSecret,
        permission: {
          allowed: secretPermissions.data.create.allowed && quickLinkPermissions.data.patch.allowed,
          reason: secretPermissions.data.create.reason || quickLinkPermissions.data.patch.reason,
        },
      }}
      pageDescription={pageDescription}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
