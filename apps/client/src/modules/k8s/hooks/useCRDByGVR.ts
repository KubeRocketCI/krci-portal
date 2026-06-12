import { useMemo } from "react";
import { useCRDCatalog } from "./useCRDCatalog";
import type { CRDObject } from "@my-project/shared";

export interface UseCRDByGVRResult {
  crd: CRDObject | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useCRDByGVR(group: string, version: string, plural: string): UseCRDByGVRResult {
  const watch = useCRDCatalog();
  const crd = useMemo(
    () =>
      watch.data.array.find(
        (c) =>
          c.spec.group === group &&
          c.spec.names.plural === plural &&
          // Only match versions that the API server is currently serving — a deprecated
          // (served: false) version would return 405/404 on subsequent CR requests.
          c.spec.versions.some((v) => v.name === version && v.served !== false)
      ),
    [watch.data.array, group, version, plural]
  );
  return { crd, isLoading: watch.isLoading, error: watch.error };
}
