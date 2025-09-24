import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionSummary, Typography, AccordionDetails, Grid, Tooltip } from "@mui/material";
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
            <Typography variant={"h6"}>
              <Grid container spacing={1} alignItems={"center"}>
                <Grid item sx={{ mr: (t) => t.typography.pxToRem(5) }}>
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                          {`Connected: ${status.connected === undefined ? "Unknown" : status.connected}`}
                        </Typography>
                        {!!status.statusError && (
                          <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                            {status.statusError}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </Grid>
                <Grid item>{chatAssistantSecret?.metadata.name}</Grid>
                {!!ownerReference && (
                  <Grid item>
                    <Tooltip title={`Managed by ${ownerReference}`}>
                      <ShieldX size={20} />
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            </Typography>
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
