import { PipelineRun } from "../../types.js";

export interface PipelineRunRef {
  namespace: string;
  name: string;
}

/** Identity of a run in a `pipelineRun.stop` request. */
export const toPipelineRunRef = ({ metadata }: PipelineRun): PipelineRunRef => ({
  namespace: metadata.namespace ?? "",
  name: metadata.name,
});

/** `namespace/name`; unique across namespaces. */
export const getPipelineRunRefKey = ({ namespace, name }: PipelineRunRef): string => `${namespace}/${name}`;
