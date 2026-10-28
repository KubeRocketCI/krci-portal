interface NamedReport {
  metadata?: { name?: string; labels?: Record<string, string | undefined> };
}

/**
 * Resource Name of a Trivy report, for both display and sort: the resource label, else the
 * report name (`<kind>-<name>`).
 */
export const createResourceNameGetter =
  (labelKey: string) =>
  (report: NamedReport): string | undefined =>
    report.metadata?.labels?.[labelKey] || report.metadata?.name;
