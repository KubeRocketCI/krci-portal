import { KubeObjectBase, KubeObjectListBase } from "@my-project/shared";

export const MSG_TYPE = {
  ADDED: "ADDED",
  MODIFIED: "MODIFIED",
  DELETED: "DELETED",
  ERROR: "ERROR",
} as const;

export type MsgType = (typeof MSG_TYPE)[keyof typeof MSG_TYPE];

export type CustomKubeObjectList<T extends KubeObjectBase> = Omit<KubeObjectListBase<T>, "items"> & {
  items: Map<string, T>;
};
