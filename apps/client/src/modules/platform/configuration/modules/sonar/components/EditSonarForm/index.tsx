import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import { safeDecode } from "@my-project/shared";
import { EditSonarFormValues } from "./schema";
import { NAMES } from "./constants";
import type { EditSonarFormProps } from "./types";
import { EditSonarFormProvider } from "./providers/form/provider";
import { useEditSonarForm } from "./providers/form/hooks";
import { ExternalURL, Token, URL } from "./components/fields";
import { FormSection } from "@/core/components/FormSection";
import { Separator } from "@/core/components/ui/separator";
import { Globe, Shield } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { useStore } from "@tanstack/react-form";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

export type { EditSonarFormProps } from "./types";

export const EditSonarForm: React.FC<EditSonarFormProps> = ({ secret, quickLink, ownerReference, onClose }) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  const [requestError, setRequestError] = React.useState<RequestError | null>(null);

  const defaultValues = React.useMemo<Partial<EditSonarFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: quickLink?.spec?.url || "",
      [NAMES.TOKEN]: safeDecode(secret?.data?.token || "", ""),
      [NAMES.URL]: safeDecode(secret?.data?.url || "", ""),
    }),
    [quickLink, secret]
  );

  const handleSubmit = React.useCallback(
    async (values: EditSonarFormValues) => {
      try {
        setRequestError(null);

        await trpc.k8s.manageSonarIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "edit",
          dirtyFields: {
            quickLink: values[NAMES.EXTERNAL_URL] !== (quickLink?.spec?.url || ""),
            secret:
              values[NAMES.TOKEN] !== safeDecode(secret?.data?.token || "", "") ||
              values[NAMES.URL] !== safeDecode(secret?.data?.url || "", ""),
          },
          quickLink: quickLink
            ? {
                name: quickLink.metadata.name,
                externalUrl: values[NAMES.EXTERNAL_URL],
                currentResource: quickLink,
              }
            : undefined,
          secret: {
            token: values[NAMES.TOKEN],
            url: values[NAMES.URL],
            currentResource: secret,
          },
        });

        toast.success("SonarQube integration saved successfully");
        onClose();
      } catch (error) {
        console.error("Failed to save SonarQube integration:", error);
        setRequestError(error as RequestError);
        toast.error(error instanceof Error ? error.message : "Failed to save SonarQube integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, quickLink, secret, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <EditSonarFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-4">
            <DialogTitle className="text-xl font-medium">Edit SonarQube Integration</DialogTitle>
          </div>
          <FormGuideToggleButton />
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4">
              {requestError && (
                <Alert variant="destructive" title="Failed to save SonarQube integration">
                  {getK8sErrorMessage(requestError)}
                </Alert>
              )}
              <EditSonarFormContent ownerReference={ownerReference} />
            </div>
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions />
      </DialogFooter>
    </EditSonarFormProvider>
  );
};

const EditSonarFormContent = ({ ownerReference }: { ownerReference: string | undefined }) => {
  return (
    <>
      <FormSection icon={Globe} title="Quick Link">
        <ExternalURL disabled={!!ownerReference} />
      </FormSection>
      <Separator />
      <FormSection icon={Shield} title="Connection">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <URL disabled={!!ownerReference} />
          </div>
          <div className="col-span-6">
            <Token disabled={!!ownerReference} />
          </div>
        </div>
      </FormSection>
    </>
  );
};

const FormActions = () => {
  const form = useEditSonarForm();
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  return (
    <div className="flex w-full justify-between gap-2">
      <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
        Undo Changes
      </Button>
      <Button
        onClick={() => form.handleSubmit()}
        size="sm"
        variant="default"
        disabled={!isDirty || isSubmitting || !canSubmit}
      >
        Save
      </Button>
    </div>
  );
};
