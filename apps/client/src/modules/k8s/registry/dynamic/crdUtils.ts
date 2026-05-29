import type { CRDObject } from "@my-project/shared";

type CRDVersion = CRDObject["spec"]["versions"][number];

/**
 * jsonPath of the built-in "Age" printer column the Kubernetes API server implicitly
 * adds to every CRD. The UI renders age via its own column, so all printer-column
 * consumers skip this entry to avoid rendering it twice.
 */
export const CREATION_TIMESTAMP_PRINTER_COL_PATH = ".metadata.creationTimestamp";

/**
 * Pick the version a UI consumer should send to the API server. Precedence:
 * 1. `preferredVersion` if it exists AND is served
 * 2. The storage version if it is served (a deprecated storage version can have served:false during migration)
 * 3. The first served version
 * 4. `versions[0]` as a last-resort fallback so we never throw on a malformed CRD here
 *
 * Returns `undefined` only when the CRD has an empty versions array — every other
 * path returns a real `CRDVersion`. Centralizes the version-resolution logic
 * previously inlined in buildCRDescriptor, PrinterColumnsRows, and CR list view.
 */
export function resolveCRDVersion(crd: CRDObject, preferredVersion?: string): CRDVersion | undefined {
  const versions = crd.spec.versions;
  if (versions.length === 0) {
    return undefined;
  }
  const isServed = (v: CRDVersion) => v.served !== false;

  if (preferredVersion) {
    const match = versions.find((v) => v.name === preferredVersion && isServed(v));
    if (match) return match;
  }
  const storageServed = versions.find((v) => v.storage && isServed(v));
  if (storageServed) return storageServed;
  const firstServed = versions.find(isServed);
  if (firstServed) return firstServed;
  return versions[0];
}

/**
 * Return the name of the version that the sidebar / direct deep-links should
 * use. Mirrors {@link resolveCRDVersion} so a deprecated storage version
 * (storage:true, served:false) does not get linked — clicking such a link
 * would land on the "Unknown custom resource" error page because the served
 * filter in `useCRDByGVR` would reject it.
 */
export function storageVersionName(crd: CRDObject): string {
  const version = resolveCRDVersion(crd);
  if (!version) {
    throw new Error(`CRD "${crd.metadata?.name ?? crd.spec.names.kind}" has no versions defined`);
  }
  return version.name;
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
