import { KubeObjectBase } from "../../../../../../../models";
import { createRandomString, truncateName } from "../../../../../../../utils";
import { PipelineRun } from "../../types";

const rerunIdentifier = "r-";

const removeSystemLabels = (resource: KubeObjectBase) => {
  Object.keys(resource.metadata.labels ?? {}).forEach((label) => {
    if (label.startsWith("tekton.dev/")) {
      delete (resource.metadata.labels ?? {})[label]; // eslint-disable-line no-param-reassign
    }
  });
};

const getNamePrefixForRerun = (name: string) => {
  const namePostfix = `-${createRandomString(4)}`;

  const truncatedName = truncateName(
    name,
    rerunIdentifier.length + namePostfix.length
  );

  const fullPipelineRunName = `${rerunIdentifier}${truncatedName}${namePostfix}`;

  return fullPipelineRunName;
};

const generateNewPipelineRunPayload = ({
  pipelineRun,
  rerun,
}: {
  pipelineRun: PipelineRun;
  rerun: boolean;
}) => {
  const {
    annotations,
    labels,
    name: _name,
    namespace,
    generateName,
  } = pipelineRun.metadata;

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

  // @ts-ignore
  payload.metadata = {
    annotations: annotations || {},
    name: getName(),
    labels: labels || {},
    namespace,
  };
  if (rerun) {
    payload.metadata.labels = payload.metadata.labels || {};
    payload.metadata.labels["dashboard.tekton.dev/rerunOf"] = name;
  }

  removeSystemLabels(payload);

  /*
    This is used by Tekton Pipelines as part of the conversion between v1beta1
    and v1 resources. Creating a run with this in place prevents it from actually
    executing and instead adopts the status of the original TaskRuns.
  
    Ideally we would just delete all `tekton.dev/*` annotations as we do with labels but
    `tekton.dev/v1beta1Resources` is required for pipelines that use PipelineResources,
    and there may be other similar annotations that are still required.
  
    When v1beta1 has been fully removed from Tekton Pipelines we can revisit this
    and remove all remaining `tekton.dev/*` annotations.
    */
  if (payload.metadata.annotations) {
    delete payload.metadata.annotations["tekton.dev/v1beta1TaskRuns"];
    delete payload.metadata.annotations[
      "kubectl.kubernetes.io/last-applied-configuration"
    ];
  }

  Object.keys(payload.metadata).forEach(
    (i) =>
      (payload.metadata as Record<string, any>)[i] === undefined &&
      delete (payload.metadata as Record<string, any>)[i]
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
