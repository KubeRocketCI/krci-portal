import { Pause, Play, Rocket } from "lucide-react";
import { k8sCronJobConfig, k8sJobConfig, CRONJOB_NAME_LABEL, RUN_NOW_ANNOTATION } from "@my-project/shared";
import type { KubeObjectBase, KubeObjectDraft } from "@my-project/shared";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ConfirmDialog } from "@/core/components/Confirm";
import { usePermissions } from "@/k8s/api/hooks/usePermissions";
import { useK8sUpdate } from "@/modules/k8s/hooks/useK8sUpdate";
import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";

interface CronJobView extends KubeObjectBase {
  spec?: {
    suspend?: boolean;
    jobTemplate?: {
      metadata?: { labels?: Record<string, string>; annotations?: Record<string, string> };
      spec?: Record<string, unknown>;
    };
  };
}

/**
 * Header actions for CronJob:
 *  - Run now: creates a one-off Job from `spec.jobTemplate` owned by the CronJob.
 *  - Suspend / Resume: flips `spec.suspend` via a full-object update.
 */
export function CronJobHeaderActions({ item }: { item: KubeObjectBase }) {
  const cronJob = item as CronJobView;
  const namespace = cronJob.metadata?.namespace ?? "";
  const name = cronJob.metadata?.name ?? "";
  const suspended = cronJob.spec?.suspend === true;

  const cronJobPerms = usePermissions({
    group: k8sCronJobConfig.group,
    version: k8sCronJobConfig.version,
    resourcePlural: k8sCronJobConfig.pluralName,
  });
  const jobPerms = usePermissions({
    group: k8sJobConfig.group,
    version: k8sJobConfig.version,
    resourcePlural: k8sJobConfig.pluralName,
  });

  const update = useK8sUpdate(k8sCronJobConfig);
  const { triggerCreate } = useBasicCRUD<KubeObjectDraft>(k8sJobConfig);
  const openConfirm = useDialogOpener(ConfirmDialog);

  const handleToggleSuspend = () => {
    openConfirm({
      text: `${suspended ? "Resume" : "Suspend"} CronJob "${name}"?`,
      actionCallback: async () => {
        const body = structuredClone(item) as CronJobView;
        body.spec = { ...(body.spec ?? {}), suspend: !suspended };
        update.mutate({ namespace, name, body });
      },
    });
  };

  const handleRunNow = () => {
    openConfirm({
      text: `Trigger a manual run of CronJob "${name}" now?`,
      actionCallback: async () => {
        const template = cronJob.spec?.jobTemplate ?? {};
        const jobName = `${name}-manual-${Math.floor(Date.now() / 1000)}`;
        const job = {
          apiVersion: k8sJobConfig.apiVersion,
          kind: k8sJobConfig.kind,
          metadata: {
            name: jobName,
            namespace,
            labels: { ...(template.metadata?.labels ?? {}), [CRONJOB_NAME_LABEL]: name },
            annotations: { ...(template.metadata?.annotations ?? {}), [RUN_NOW_ANNOTATION]: "true" },
            ownerReferences: [
              {
                apiVersion: k8sCronJobConfig.apiVersion,
                kind: k8sCronJobConfig.kind,
                name,
                uid: cronJob.metadata?.uid ?? "",
                controller: false,
                blockOwnerDeletion: true,
              },
            ],
          },
          spec: structuredClone(template.spec ?? {}),
        } as unknown as KubeObjectDraft;

        triggerCreate({ data: { resource: job } });
      },
    });
  };

  return (
    <>
      <ButtonWithPermission
        allowed={jobPerms.data.create.allowed}
        reason={jobPerms.data.create.reason ?? ""}
        ButtonProps={{ variant: "outline", size: "sm", onClick: handleRunNow }}
      >
        <Rocket size={14} className="mr-1.5" /> Run now
      </ButtonWithPermission>
      <ButtonWithPermission
        allowed={cronJobPerms.data.update.allowed}
        reason={cronJobPerms.data.update.reason ?? ""}
        ButtonProps={{ variant: "outline", size: "sm", onClick: handleToggleSuspend }}
      >
        {suspended ? <Play size={14} className="mr-1.5" /> : <Pause size={14} className="mr-1.5" />}
        {suspended ? "Resume" : "Suspend"}
      </ButtonWithPermission>
    </>
  );
}
