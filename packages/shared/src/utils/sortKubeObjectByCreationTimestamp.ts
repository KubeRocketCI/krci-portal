import { KubeObjectBase } from "../models/index.js";

export const sortKubeObjectByCreationTimestamp = (
  a: KubeObjectBase,
  b: KubeObjectBase,
  backwards?: boolean
): number => {
  const aResourceCreationTimeStamp = a.metadata.creationTimestamp?.valueOf() ?? 0;
  const bResourceCreationTimeStamp = b.metadata.creationTimestamp?.valueOf() ?? 0;

  if (aResourceCreationTimeStamp > bResourceCreationTimeStamp) {
    return backwards ? 1 : -1;
  } else {
    return backwards ? -1 : 1;
  }
};
