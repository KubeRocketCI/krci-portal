import { FINDING_STATE_PARAMS } from "./constants.js";
import type { DefectDojoFindingStateFilter, DefectDojoSeverity } from "./constants.js";
import type { DefectDojoScope } from "./types.js";

/** One GET request to DefectDojo. Values that are `undefined` are not sent. */
export interface DefectDojoRequest {
  path: string;
  query: Record<string, string | number | boolean | undefined>;
}

export interface ListPage {
  limit: number;
  offset: number;
}

/**
 * Value of a tag filter: the tags lower-cased and joined by commas.
 *
 * DefectDojo stores tags in lower case and compares the values of its `__and` filters as they are.
 * `null` when no tag can match: an empty list, or a tag that is empty or holds a comma or a space, none of which a
 * stored tag does. An empty list would match every row and a comma would split one tag into two.
 */
export function toTagFilter(tags: readonly string[]): string | null {
  if (tags.length === 0 || tags.some((tag) => tag === "" || /[\s,]/.test(tag))) {
    return null;
  }
  return tags.map((tag) => tag.toLowerCase()).join(",");
}

/** Products that carry every tag of `tagFilter`, with their Product Type, in a stable order for paging. */
export function productsRequest(tagFilter: string, page: ListPage): DefectDojoRequest {
  return {
    path: "/api/v2/products/",
    query: { tags__and: tagFilter, prefetch: "prod_type", o: "id", limit: page.limit, offset: page.offset },
  };
}

/**
 * Tests that carry every tag of `tagFilter`, with their engagement, product and Product Type, in a stable order
 * for paging.
 */
export function testsRequest(
  filter: { tagFilter: string; branchTag?: string; scanType?: string },
  page: ListPage
): DefectDojoRequest {
  return {
    path: "/api/v2/tests/",
    query: {
      tags__and: filter.tagFilter,
      branch_tag: filter.branchTag,
      scan_type: filter.scanType,
      prefetch: "engagement",
      o: "created",
      limit: page.limit,
      offset: page.offset,
    },
  };
}

/** One test. DefectDojo answers 404 to a test that does not exist. */
export function testRequest(testId: number): DefectDojoRequest {
  return { path: `/api/v2/tests/${testId}/`, query: {} };
}

/** The test type of a scan type. DefectDojo names a test type after its scan type. */
export function testTypeRequest(scanType: string): DefectDojoRequest {
  return { path: "/api/v2/test_types/", query: { name: scanType } };
}

/**
 * Severity counts of a scope, in one request (API v3), duplicates left out. The answer carries one finding row,
 * reduced to its id. `activeOnly: false` counts findings of every state.
 */
export function countsRequest(scope: DefectDojoScope, activeOnly: boolean): DefectDojoRequest {
  return {
    path: "/api/v3/findings",
    query: {
      include: "counts",
      fields: "id",
      limit: 1,
      duplicate: false,
      active: activeOnly ? true : undefined,
      ...("testId" in scope ? { test: scope.testId } : { asset__in: scope.productIds.join(",") }),
    },
  };
}

export interface FindingsRequestFilter {
  scope: DefectDojoScope;
  state: DefectDojoFindingStateFilter;
  severities: readonly DefectDojoSeverity[];
  /** Ids of the test types of the wanted scan types. Empty: every scan type. */
  testTypeIds: readonly number[];
  vulnerabilityId?: string;
  component?: string;
  /** Rows of the page. The caller keeps it within `FINDINGS_MAX_PAGE_SIZE`. */
  limit: number;
  offset: number;
}

/** One page of findings, most severe first, with the ids of their test, engagement and product. */
export function findingsRequest(filter: FindingsRequestFilter): DefectDojoRequest {
  return {
    path: "/api/v2/findings/",
    query: {
      ...("testId" in filter.scope ? { test: filter.scope.testId } : { product: filter.scope.productIds.join(",") }),
      ...(filter.state === "any" ? {} : { [FINDING_STATE_PARAMS[filter.state]]: true }),
      duplicate: false,
      severity: filter.severities.length > 0 ? filter.severities.join(",") : undefined,
      test__test_type: filter.testTypeIds.length > 0 ? filter.testTypeIds.join(",") : undefined,
      vulnerability_id: filter.vulnerabilityId || undefined,
      component_name: filter.component || undefined,
      o: "numerical_severity",
      related_fields: true,
      limit: filter.limit,
      offset: filter.offset,
    },
  };
}
