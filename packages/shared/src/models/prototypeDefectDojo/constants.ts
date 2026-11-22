// PROTOTYPE (EPMDEDP-16072): throwaway DefectDojo read path. Not for main.

export const PROTOTYPE_DEFECTDOJO_LEVELS = ["code", "image", "runtime"] as const;

/** Level of a test by its `scan_type`. A scan type absent here has no level. */
export const PROTOTYPE_DEFECTDOJO_SCAN_TYPE_LEVEL: Record<string, (typeof PROTOTYPE_DEFECTDOJO_LEVELS)[number]> = {
  "Semgrep JSON Report": "code",
  "Gitleaks Scan": "code",
  "Trivy Scan": "image",
  "Anchore Grype": "image",
  "Trivy Operator Scan": "runtime",
};

/** Severities in DefectDojo order, most severe first. */
export const PROTOTYPE_DEFECTDOJO_SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;

/** Tag keys written by the CI tasks and the security operator. A tag is `<key>:<value>`, stored lower-case. */
export const PROTOTYPE_DEFECTDOJO_TAG_KEY = {
  codebase: "app.edp.epam.com/codebase",
  tenant: "app.edp.epam.com/tenant",
  ociImage: "oci-image",
  cluster: "k8s-cluster",
  namespace: "k8s-namespace",
  workload: "k8s-workload",
  container: "k8s-container",
  app: "app",
  /** Not written by the operator yet. */
  reportKind: "report-kind",
} as const;

/** Trivy Operator report kinds the operator imports. */
export const PROTOTYPE_DEFECTDOJO_REPORT_KINDS = ["VulnerabilityReport", "ExposedSecretReport"] as const;

/** Scan type of the secret scanner of the Code level. */
export const PROTOTYPE_DEFECTDOJO_CODE_SECRETS_SCAN_TYPE = "Gitleaks Scan";

export const PROTOTYPE_DEFECTDOJO_FINDINGS_MAX_LIMIT = 500;

/** Page size limit of a findings list that resolves the test of every row. */
export const PROTOTYPE_DEFECTDOJO_FINDINGS_WITH_TEST_MAX_LIMIT = 100;
