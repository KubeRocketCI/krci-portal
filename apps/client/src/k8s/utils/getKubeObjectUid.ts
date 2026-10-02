import type { KubeObjectBase } from "@my-project/shared";

/** Selection row id for Kubernetes objects. */
export const getKubeObjectUid = (item: KubeObjectBase): string => item.metadata.uid;
