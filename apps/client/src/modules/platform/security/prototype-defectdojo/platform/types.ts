// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type {
  PrototypeDefectDojoProduct,
  PrototypeDefectDojoScopeCounts,
  PrototypeDefectDojoSeverityCounts,
  PrototypeDefectDojoTest,
} from "@my-project/shared";

/** A Stage of the installation. */
export interface PlatformStage {
  /** Stage `spec.cdPipeline`. */
  cdPipeline: string;
  /** Stage `spec.name`. */
  stage: string;
  /** Stage `spec.clusterName`. */
  clusterName: string;
  /** Stage `spec.namespace`. */
  namespace: string;
}

/** An Argo CD Application of a Stage and the codebase it deploys. */
export interface PlatformApplication {
  /** Application `metadata.name`. Equals the test tag `app`. */
  applicationName: string;
  /** Application label `app.edp.epam.com/app-name`. */
  codebaseName: string;
  /** Application label `app.edp.epam.com/pipeline`. */
  cdPipeline: string;
  /** Application label `app.edp.epam.com/stage`. */
  stage: string;
}

/** Kubernetes values the Security pages join to DefectDojo. Every value is read from an object, none is built. */
export interface PlatformScope {
  /** Route parameter `clusterName` of the portal, for links. */
  portalClusterName: string;
  /** Namespace of the installation. Equals the tag `app.edp.epam.com/tenant`. */
  installationNamespace: string;
  stages: PlatformStage[];
  applications: PlatformApplication[];
  /** `metadata.name` of every Codebase of the installation. */
  codebases: string[];
}

/** A namespace product and what the installation knows about its namespace. */
export interface NamespaceRow {
  product: PrototypeDefectDojoProduct;
  /** Value of the product tag `k8s-cluster`. */
  cluster: string;
  /** Value of the product tag `k8s-namespace`. */
  namespace: string;
  /** The product carries the tag `app.edp.epam.com/tenant` of this installation. */
  managed: boolean;
  /** The Stage whose cluster and namespace equal the product tags. */
  stage: PlatformStage | null;
  /** Active Runtime findings of the namespace. `null`: not loaded. */
  counts: PrototypeDefectDojoSeverityCounts | null;
}

/** A codebase product, reached through the CI tests tagged with the installation namespace. */
export interface CodebaseRow {
  /** Value of the test tag `app.edp.epam.com/codebase`. */
  codebaseName: string;
  product: { id: number; name: string; url: string };
  /** A Codebase object with this name exists. */
  known: boolean;
  /** Code and Image tests of the codebase. */
  tests: PrototypeDefectDojoTest[];
}

export type PlatformState = "loading" | "unreachable" | "noData" | "data";

export interface PlatformModel {
  /** `notConfigured` covers the whole page. */
  connection: "loading" | "notConfigured" | "ready";
  /** State of the product list. `noData`: the Product Type holds no product. */
  state: PlatformState;
  /** Distinct values of the product tag `k8s-cluster`. */
  clusters: string[];
  /** Namespace products of the selected clusters. */
  namespaces: NamespaceRow[];
  /** Active Runtime findings of the selected clusters together. `null`: not loaded or no namespace product. */
  runtimeTotal: PrototypeDefectDojoSeverityCounts | null;
  /** State of the CI test list. `noData`: no CI test carries the tenant tag. */
  codebasesState: PlatformState | "notRequested";
  codebases: CodebaseRow[];
  /** Counts by CI test id. */
  testCounts: Map<number, PrototypeDefectDojoScopeCounts>;
  retry: () => void;
}

export type SecurityOverviewVariantKey = "A" | "B" | "C";

export interface SecurityPageProps {
  scope: PlatformScope;
  /** Clusters picked by the user. `null`: the clusters of the installation's Stages. */
  pickedClusters: string[] | null;
  onClustersChange: (clusters: string[]) => void;
  /** Namespace the Vulnerabilities list starts on. Used when exactly one cluster is picked. */
  initialNamespace?: string;
  /** Illustration note of a story scope. */
  note?: string | null;
}
