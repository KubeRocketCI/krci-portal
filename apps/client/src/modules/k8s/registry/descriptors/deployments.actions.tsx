import type { KubeObjectBase } from "@my-project/shared";
import { k8sDeploymentConfig } from "@my-project/shared";
import { ScaleAction } from "@/modules/k8s/components/ScaleAction";
import { RestartAction } from "@/modules/k8s/components/RestartAction";
import { RollbackAction } from "@/modules/k8s/components/RollbackAction";

export function DeploymentHeaderActions({ item }: { item: KubeObjectBase }) {
  return (
    <>
      <ScaleAction item={item} config={k8sDeploymentConfig} />
      <RestartAction item={item} config={k8sDeploymentConfig} />
      <RollbackAction item={item} config={k8sDeploymentConfig} />
    </>
  );
}
