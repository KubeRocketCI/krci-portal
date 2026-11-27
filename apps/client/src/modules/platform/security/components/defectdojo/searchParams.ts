import {
  DEFECTDOJO_FINDING_STATES,
  DEFECTDOJO_SEVERITIES,
  PLATFORM_LIST_DEFAULT_PAGE_SIZE,
  SCAN_FINDINGS_MAX_PAGE,
  findingClustersSchema,
  type DefectDojoFindingState,
  type DefectDojoSeverity,
  type NamespacePlace,
} from "@my-project/shared";
import { z } from "zod";
import { k8sNameSearchParam } from "@/core/router/searchParams";
import { PLATFORM_LIST_PAGE_SIZES } from "./constants";

/** A 1-based page in the URL. */
export const pageSearchParam = z.number().int().positive().optional().catch(undefined);

/** The search params the platform list pages share. A value that does not parse reads as left out. */
export const platformListSearchParams = {
  /** One cluster, or repeated (an array). Left out: the server's default, the Stage clusters or every cluster. */
  cluster: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .pipe(findingClustersSchema)
    .optional()
    .catch(undefined),
  /** The namespace of the workloads, in each of the clusters. */
  namespace: k8sNameSearchParam,
  codebase: k8sNameSearchParam,
  severity: z.enum(DEFECTDOJO_SEVERITIES).optional().catch(undefined),
  state: z.enum(DEFECTDOJO_FINDING_STATES).optional().catch(undefined),
  rowsPerPage: z
    .number()
    .int()
    .refine((size) => PLATFORM_LIST_PAGE_SIZES.includes(size))
    .optional()
    .catch(undefined),
};

/** The 0-based page and the size of a list request, from the 1-based page and the size in the URL. */
export function toPageRequest(page: number | undefined, rowsPerPage: number | undefined) {
  return {
    page: Math.min((page ?? 1) - 1, SCAN_FINDINGS_MAX_PAGE),
    pageSize: rowsPerPage ?? PLATFORM_LIST_DEFAULT_PAGE_SIZE,
  };
}

/** The filters a platform list opens with for one namespace of one cluster, with the severity and the state in view. */
export function namespaceListSearch(
  { cluster, namespace }: NamespacePlace,
  { severity, state }: { severity?: DefectDojoSeverity; state?: DefectDojoFindingState } = {}
) {
  return { cluster: [cluster], namespace, severity, state };
}
