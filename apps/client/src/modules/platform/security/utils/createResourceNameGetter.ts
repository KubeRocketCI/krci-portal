interface NamedReport {
  metadata?: { name?: string; labels?: Record<string, string | undefined> };
}

/**
 * The name a Trivy report's Resource Name column shows, and sorts by: the resource label,
 * else the report name. The report name is `<kind>-<name>`, so sorting by it groups rows by kind.
 */
export const createResourceNameGetter =
  (labelKey: string) =>
  (report: NamedReport): string | undefined =>
    report.metadata?.labels?.[labelKey] || report.metadata?.name;
