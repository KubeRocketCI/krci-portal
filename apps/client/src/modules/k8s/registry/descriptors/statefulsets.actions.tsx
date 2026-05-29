import type { KubeObjectBase } from "@my-project/shared";
import { k8sStatefulSetConfig } from "@my-project/shared";
import { ScaleAction } from "@/modules/k8s/components/ScaleAction";
import { RestartAction } from "@/modules/k8s/components/RestartAction";

export function StatefulSetHeaderActions({ item }: { item: KubeObjectBase }) {
  return (
    <>
      <ScaleAction item={item} config={k8sStatefulSetConfig} />
      <RestartAction item={item} config={k8sStatefulSetConfig} />
    </>
  );
}
