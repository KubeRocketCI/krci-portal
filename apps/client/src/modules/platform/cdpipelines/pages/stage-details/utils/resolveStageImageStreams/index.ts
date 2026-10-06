import { CDPipeline, CodebaseImageStream, Stage } from "@my-project/shared";

/** Normalize CR names to their image-stream form (dots → dashes) and dedupe into a Set. */
export const normalizeStreamNameSet = (names: string[] = []): Set<string> =>
  new Set(names.map((name) => name.replaceAll(".", "-")));

/**
 * Find the stage immediately preceding `currentStageOrder` **within the same CD pipeline**.
 *
 * Every pipeline's Stages live in one namespace, so matching on `order` alone — the previous
 * behaviour — can return a foreign pipeline's stage whose `spec.name` differs. That makes the
 * `<pipeline>-<prevStage>-<codebase>-verified` lookup below resolve to nothing, leaving an empty
 * "Deployed version" dropdown for every application on the stage. Scoping by `cdPipeline`
 * prevents that cross-pipeline collision.
 */
export const findPreviousStage = (
  stages: Stage[],
  currentStageOrder: number,
  cdPipelineName: string
): Stage | undefined =>
  stages.find((stage) => stage.spec.order === currentStageOrder - 1 && stage.spec.cdPipeline === cdPipelineName);

/** Name of the verified stream the cd-pipeline-operator creates per stage and application. */
export const verifiedStreamName = (cdPipelineName: string, stageName: string, codebase: string): string =>
  `${cdPipelineName}-${stageName}-${codebase}-verified`;

/** The stage's own verified stream. */
export const getVerifiedImageStream = (
  imageStreams: CodebaseImageStream[],
  cdPipelineName: string,
  stageName: string,
  codebase: string
): CodebaseImageStream | undefined => {
  const name = verifiedStreamName(cdPipelineName, stageName, codebase);
  return imageStreams.find((stream) => stream.metadata.name === name);
};

export interface ResolveInputImageStreamParams {
  /** Image streams already filtered to a single codebase. */
  imageStreams: CodebaseImageStream[];
  stageOrder: number;
  /** Normalized set of the pipeline's `inputDockerStreams`. */
  inputDockerStreamsSet: Set<string>;
  /** All stages in the namespace (scoped to the pipeline internally). */
  stages: Stage[];
  cdPipelineName: string;
  /** Whether this application is in the pipeline's `applicationsToPromote`. */
  isPromote: boolean;
}

/**
 * Resolve the CodebaseImageStream whose tags populate the "Deployed version" dropdown for one
 * application on a stage:
 *  - non-promote application, or the first stage (order 0): the pipeline's build stream
 *    (`inputDockerStreams`);
 *  - promote application on a later stage: the previous stage's
 *    `<pipeline>-<prevStage>-<codebase>-verified` stream.
 */
export const resolveInputImageStream = ({
  imageStreams,
  stageOrder,
  inputDockerStreamsSet,
  stages,
  cdPipelineName,
  isPromote,
}: ResolveInputImageStreamParams): CodebaseImageStream | undefined => {
  if (!isPromote || stageOrder === 0) {
    return imageStreams.find((stream) => inputDockerStreamsSet.has(stream.metadata.name));
  }

  const previousStage = findPreviousStage(stages, stageOrder, cdPipelineName);
  if (!previousStage) {
    return undefined;
  }

  return imageStreams.find(
    ({ spec: { codebase }, metadata: { name } }) =>
      name === verifiedStreamName(cdPipelineName, previousStage.spec.name, codebase)
  );
};

export interface CollectStageImageStreamNamesParams {
  cdPipeline: CDPipeline;
  stage: Stage;
  /** Stages of the same pipeline; used to find the previous stage. */
  stages: Stage[];
}

/**
 * Every CodebaseImageStream name the stage Applications tab can show:
 *  - the pipeline's build streams (`inputDockerStreams`, normalized);
 *  - the stage's own verified stream per application;
 *  - the previous stage's verified stream per promoted application, when `order > 0`.
 * Deduplicated. Names that cannot be resolved (no previous stage) are omitted.
 */
export const collectStageImageStreamNames = ({
  cdPipeline,
  stage,
  stages,
}: CollectStageImageStreamNamesParams): string[] => {
  const cdPipelineName = cdPipeline.metadata.name;
  const applications = cdPipeline.spec.applications ?? [];
  const appsToPromoteSet = normalizeStreamNameSet(cdPipeline.spec.applicationsToPromote ?? []);
  const names = normalizeStreamNameSet(cdPipeline.spec.inputDockerStreams ?? []);

  for (const app of applications) {
    names.add(verifiedStreamName(cdPipelineName, stage.spec.name, app));
  }

  if (stage.spec.order > 0) {
    const previousStage = findPreviousStage(stages, stage.spec.order, cdPipelineName);
    if (previousStage) {
      for (const app of applications) {
        if (appsToPromoteSet.has(app)) {
          names.add(verifiedStreamName(cdPipelineName, previousStage.spec.name, app));
        }
      }
    }
  }

  return [...names];
};
