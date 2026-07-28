import { tektonResultAnnotations } from "../../../../../../tektonResults/annotations.js";
import { pipelineRunAnnotations } from "../../annotations.js";
import { createRandomString, truncateName } from "../../../../../../../utils/index.js";
import { PipelineRun } from "../../types.js";

const rerunIdentifier = "r-";

const SYSTEM_LABEL_PREFIXES = ["tekton.dev/", "triggers.tekton.dev/"];

const removeSystemLabels = (labels: Record<string, string> | undefined) => {
  if (!labels) return;
  for (const key of Object.keys(labels)) {
    if (SYSTEM_LABEL_PREFIXES.some((p) => key.startsWith(p))) {
      delete labels[key];
    }
  }
};

/*
  Exact keys, not a prefix list like the labels above: `tekton.dev/v1beta1TaskRuns`
  has to go (it makes the new run adopt the original TaskRuns' status instead of
  executing), but `tekton.dev/v1beta1Resources` is required for pipelines using
  PipelineResources. Revisit once v1beta1 is fully removed from Tekton.

  Listed here only if a consumer *reads* the annotation to decide something, so a
  stale value corrupts the decision — a leftover queueCancelReason makes the
  reporter disguise a genuine failure of the rerun as a cancellation. The other
  tekton-pipeline-queue annotations (queue, queue-lane, queue-admitted-at) are
  recorded facts nothing branches on, so they are deliberately left alone.
  */
const EPHEMERAL_ANNOTATION_KEYS = [
  "tekton.dev/v1beta1TaskRuns",
  "kubectl.kubernetes.io/last-applied-configuration",
  tektonResultAnnotations.tektonResultRef,
  tektonResultAnnotations.tektonRecordRef,
  tektonResultAnnotations.tektonLogRef,
  tektonResultAnnotations.historySource,
  pipelineRunAnnotations.queueCancelReason,
];

const removeEphemeralAnnotations = (annotations: Record<string, string> | undefined) => {
  if (!annotations) return;
  for (const key of EPHEMERAL_ANNOTATION_KEYS) {
    delete annotations[key];
  }
};

const getNamePrefixForRerun = (name: string) => {
  const namePostfix = `-${createRandomString(4)}`;

  const truncatedName = truncateName(name, rerunIdentifier.length + namePostfix.length);

  const fullPipelineRunName = `${rerunIdentifier}${truncatedName}${namePostfix}`;

  return fullPipelineRunName;
};

const generateNewPipelineRunPayload = ({ pipelineRun, rerun }: { pipelineRun: PipelineRun; rerun: boolean }) => {
  const { annotations, labels, name: _name, namespace, generateName } = pipelineRun.metadata;

  let name = _name;

  if (_name.startsWith(rerunIdentifier)) {
    name = name.slice(rerunIdentifier.length);
  }

  const payload = structuredClone(pipelineRun);

  function getName() {
    if (rerun) {
      return getNamePrefixForRerun(name);
    }

    return generateName || `${name}-`;
  }

  // Cloned, not aliased: callers pass the object straight out of the watch cache,
  // so the stripping below would otherwise delete keys off the live PipelineRun.
  // @ts-ignore
  payload.metadata = {
    annotations: structuredClone(annotations) ?? {},
    name: getName(),
    labels: structuredClone(labels) ?? {},
    namespace,
  };
  if (rerun) {
    payload.metadata.labels = payload.metadata.labels || {};
    payload.metadata.labels["dashboard.tekton.dev/rerunOf"] = name;
  }

  removeSystemLabels(payload.metadata.labels as Record<string, string>);

  removeEphemeralAnnotations(payload.metadata.annotations as Record<string, string>);

  Object.keys(payload.metadata).forEach(
    (i) =>
      (payload.metadata as Record<string, any>)[i] === undefined && delete (payload.metadata as Record<string, any>)[i]
  );

  delete payload.status;

  delete payload.spec?.status;

  return payload;
};

export const createRerunPipelineRun = (pipelineRun: PipelineRun) => {
  return generateNewPipelineRunPayload({
    pipelineRun,
    rerun: true,
  });
};
