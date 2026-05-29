import type { KubeObjectBase } from "@my-project/shared";
import { k8sDaemonSetConfig } from "@my-project/shared";
import { RestartAction } from "@/modules/k8s/components/RestartAction";

export function DaemonSetHeaderActions({ item }: { item: KubeObjectBase }) {
  return <RestartAction item={item} config={k8sDaemonSetConfig} />;
}
