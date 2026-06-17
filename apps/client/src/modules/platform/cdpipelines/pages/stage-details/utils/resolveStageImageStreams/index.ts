import { CodebaseImageStream, Stage } from "@my-project/shared";

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

/** The stage's own verified stream: `<pipeline>-<stage>-<codebase>-verified`. */
export const getVerifiedImageStream = (
  imageStreams: CodebaseImageStream[],
  cdPipelineName: string,
  stageName: string,
  codebase: string
): CodebaseImageStream | undefined =>
  imageStreams.find(({ metadata: { name } }) => name === `${cdPipelineName}-${stageName}-${codebase}-verified`);

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
      name === `${cdPipelineName}-${previousStage.spec.name}-${codebase}-verified`
  );
};
