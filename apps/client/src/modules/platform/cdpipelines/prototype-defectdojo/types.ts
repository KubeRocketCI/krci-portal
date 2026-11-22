// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type {
  PrototypeDefectDojoProduct,
  PrototypeDefectDojoScopeCounts,
  PrototypeDefectDojoSeverityCounts,
  PrototypeDefectDojoTest,
} from "@my-project/shared";

/** An Argo CD Application of a Stage and the codebase it deploys. */
export interface EnvironmentApplication {
  /** Application `metadata.name`. Equals the test tag `app`. */
  applicationName: string;
  /** Application label `app.edp.epam.com/app-name`. */
  codebaseName: string;
}

/** An Environment: one Stage of a CDPipeline. Every value is read from an object, none is built. */
export interface EnvironmentScope {
  /** Stage `spec.name`. */
  stage: string;
  /** Stage `spec.clusterName`. */
  clusterName: string;
  /** Stage `spec.namespace`. */
  namespace: string;
  /** Applications labelled with the pipeline and the stage. */
  applications: EnvironmentApplication[];
}

export interface PipelineFindingsScope {
  /** Route parameter `clusterName` of the portal, for links. */
  portalClusterName: string;
  cdPipeline: string;
  /** Namespace of the CDPipeline, Stage and Codebase objects. */
  namespace: string;
  /** Stages of the pipeline by `spec.order`. */
  environments: EnvironmentScope[];
}

/** One container of a workload and its Runtime tests. */
export interface RuntimeWorkload {
  key: string;
  /** Value of the `k8s-workload` tag. */
  workload: string | null;
  /** Value of the `k8s-container` tag. */
  container: string | null;
  /** Value of the `oci-image` tag. */
  imageName: string | null;
  /** Running image tag (`version` of the tests). */
  version: string;
  /** Value of the `app` tag. */
  appTag: string | null;
  /** Codebase of the Application whose name equals `appTag`. `null`: the workload belongs to no codebase. */
  codebaseName: string | null;
  /** Every test of the container is closed. The workload has no counts. */
  notRunning: boolean;
  /** Running tests, one per report kind. For a workload that is not running: its closed tests. */
  tests: PrototypeDefectDojoTest[];
}

export type EnvironmentFindingsState = "loading" | "unreachable" | "noData" | "data";

export interface EnvironmentFindings {
  scope: EnvironmentScope;
  state: EnvironmentFindingsState;
  /** Namespace product of the Environment. */
  product: PrototypeDefectDojoProduct | null;
  /** Active findings of the product. Closed tests hold none. */
  productCounts: PrototypeDefectDojoSeverityCounts | null;
  /** `null`: the tests of the Environment were not requested. */
  workloads: RuntimeWorkload[] | null;
}

export interface PipelineFindingsModel {
  /** `notConfigured` covers the whole view; the Environment states apply when `ready`. */
  connection: "loading" | "notConfigured" | "ready";
  environments: EnvironmentFindings[];
  /** Counts by test id. Closed tests have no entry. */
  counts: Map<number, PrototypeDefectDojoScopeCounts>;
  retry: () => void;
}
