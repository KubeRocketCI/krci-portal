// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type {
  PrototypeDefectDojoLevel,
  PrototypeDefectDojoScopeCounts,
  PrototypeDefectDojoTest,
} from "@my-project/shared";

/** An Environment the codebase is deployed to: one Argo CD Application and its Stage. */
export interface CodebaseEnvironment {
  /** Application label `app.edp.epam.com/pipeline`. */
  cdPipeline: string;
  /** Application label `app.edp.epam.com/stage`. */
  stage: string;
  /** Application `metadata.name`. Equals the test tag `app`. */
  applicationName: string;
  /** Stage `spec.clusterName`. */
  clusterName: string;
  /** Stage `spec.namespace`. */
  namespace: string;
}

/** Kubernetes values the codebase tab joins to DefectDojo. Every value is read from an object, none is built. */
export interface CodebaseFindingsScope {
  codebaseName: string;
  /** Namespace of the Codebase object. */
  namespace: string;
  /** `CodebaseBranch.spec.branchName` of every branch. The default branch is first. */
  branches: string[];
  /** `CodebaseImageStream.spec.imageName` of the codebase. */
  ownImageNames: string[];
  environments: CodebaseEnvironment[];
}

/** Tests about one subject: the source of a branch, one image of a branch, one container of a workload. */
export interface ScanTarget {
  key: string;
  level: PrototypeDefectDojoLevel;
  title: string;
  /** Code and Image: `branch_tag` of the tests. */
  branch: string | null;
  /** Image and Runtime: the image tag (`version` of the tests). Empty when the tests carry none. */
  version: string;
  /** Image and Runtime: value of the `oci-image` tag. */
  imageName: string | null;
  /** `imageName` equals a `CodebaseImageStream.spec.imageName` of the codebase. */
  ownImage: boolean;
  /** Runtime only. */
  environment: CodebaseEnvironment | null;
  /** Runtime only: value of the `k8s-workload` tag. */
  workload: string | null;
  /** Runtime only: value of the `k8s-container` tag. */
  container: string | null;
  /** Runtime only: every test of the container is closed. The target has no counts. */
  notRunning: boolean;
  tests: PrototypeDefectDojoTest[];
}

export type LevelState = "loading" | "unreachable" | "noData" | "data";

export interface LevelModel {
  level: PrototypeDefectDojoLevel;
  state: LevelState;
  targets: ScanTarget[];
}

export interface CodebaseFindingsModel {
  /** `notConfigured` covers the whole tab; the level states apply when `ready`. */
  connection: "loading" | "notConfigured" | "ready";
  levels: Record<PrototypeDefectDojoLevel, LevelModel>;
  /** Counts by test id. A test without an entry has no count yet. */
  counts: Map<number, PrototypeDefectDojoScopeCounts>;
  /** The counts request failed; the test lists may still hold data. */
  countsUnreachable: boolean;
  retry: () => void;
}

export type CodebaseFindingsVariantKey = "A" | "B" | "C";

/** The Environment a link asked the tab to put in focus: Application labels `pipeline` and `stage`. */
export interface EnvironmentFocus {
  cdPipeline: string;
  stage: string;
}

export interface CodebaseFindingsVariantProps {
  scope: CodebaseFindingsScope;
  /** Variants with an Environment picker start on it; the matrix marks its Runtime rows. */
  focus: EnvironmentFocus | null;
}
