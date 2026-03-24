import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { Secret, JiraServer, safeDecode } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import React from "react";
import { showToast } from "@/core/components/Snackbar";
import { Button } from "@/core/components/ui/button";
import { useAppForm } from "@/core/components/form";
import { createJiraFormSchema, CreateJiraFormValues } from "../CreateJiraForm/schema";
import { NAMES } from "../CreateJiraForm/constants";
import { useStore } from "@tanstack/react-form";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export interface EditJiraFormProps {
  secret: Secret;
  jiraServer: JiraServer | undefined;
  ownerReference: string | undefined;
  onClose: () => void;
}

export function EditJiraForm({ secret, jiraServer, ownerReference, onClose }: EditJiraFormProps) {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  const defaultValues = React.useMemo<CreateJiraFormValues>(
    () => ({
      [NAMES.URL]: jiraServer?.spec?.apiUrl || jiraServer?.spec?.rootUrl || "",
      [NAMES.USERNAME]: safeDecode(secret?.data?.username ?? "", ""),
      [NAMES.PASSWORD]: safeDecode(secret?.data?.password ?? "", ""),
    }),
    [jiraServer, secret]
  );

  const handleSubmit = React.useCallback(
    async (values: CreateJiraFormValues) => {
      const loadingToastId = showToast("Saving Jira integration", "loading");
      try {
        const result = await trpc.k8s.manageJiraIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "edit",
          dirtyFields: {
            jiraServer: values.url !== (jiraServer?.spec?.apiUrl || jiraServer?.spec?.rootUrl || ""),
            secret:
              values.username !== safeDecode(secret?.data?.username ?? "", "") ||
              values.password !== safeDecode(secret?.data?.password ?? "", ""),
            quickLink: false,
          },
          jiraServer: {
            url: values.url,
            currentResource: jiraServer,
          },
          secret: {
            username: values.username,
            password: values.password,
            currentResource: secret,
          },
        });

        if (!result.success) {
          throw new Error("Failed to save Jira integration");
        }

        showToast(result.data?.message || "Jira integration saved successfully", "success", {
          id: loadingToastId,
          duration: 5000,
        });
        onClose();
      } catch (error) {
        console.error("Failed to save Jira integration:", error);
        showToast("Failed to save Jira integration", "error", {
          id: loadingToastId,
          duration: 10000,
          description: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [clusterName, defaultNamespace, jiraServer, secret, trpc, onClose]
  );

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: createJiraFormSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmit(value);
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <>
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-4">
            <DialogTitle className="text-xl font-medium">Edit Jira Integration</DialogTitle>
          </div>
          <FormGuideToggleButton />
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
            <div className="flex flex-col gap-6">
              <form.AppField name={NAMES.URL}>
                {(field) => (
                  <field.FormTextField
                    label="URL"
                    tooltipText="Provide the base URL of your Jira instance without any specific paths or endpoints (e.g., https://your-jira-instance.com)."
                    placeholder="Enter Jira URL"
                    suffix={<CopyToClipboardButton getValue={() => url} />}
                  />
                )}
              </form.AppField>

              <form.AppField name={NAMES.USERNAME}>
                {(field) => (
                  <field.FormTextField
                    label="User"
                    tooltipText="Enter your Jira username for authentication. This is typically the username associated with your Jira account."
                    placeholder="Enter user name"
                    disabled={!!secret && !!ownerReference}
                    helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
                  />
                )}
              </form.AppField>

              <form.AppField name={NAMES.PASSWORD}>
                {(field) => (
                  <field.FormTextField
                    type="password"
                    label="Password"
                    tooltipText="Provide the password associated with your Jira account."
                    placeholder="Enter password"
                    disabled={!!secret && !!ownerReference}
                    helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
                  />
                )}
              </form.AppField>
            </div>
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <div className="flex w-full justify-between gap-2">
          <div className="flex gap-2">
            <Button onClick={onClose} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
              Undo Changes
            </Button>
          </div>
          <Button
            onClick={() => form.handleSubmit()}
            size="sm"
            variant="default"
            disabled={!isDirty || isSubmitting || !canSubmit}
          >
            Save
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
