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

/**
 * `toTagFilter` of a list that may be empty: no tags is no condition (`undefined`), not a filter that matches
 * nothing.
 */
export function toOptionalTagFilter(tags: readonly string[] = []): string | null | undefined {
  return tags.length > 0 ? toTagFilter(tags) : undefined;
}

/** Products that carry every tag of `tagFilter`, with their Product Type, in a stable order for paging. */
export function productsRequest(tagFilter: string, page: ListPage): DefectDojoRequest {
  return {
    path: "/api/v2/products/",
    query: { tags__and: tagFilter, prefetch: "prod_type", o: "id", limit: page.limit, offset: page.offset },
  };
}

/** Products that carry a tag containing `text`, case-insensitive, with their Product Type, in a stable order. */
export function productsByTagTextRequest(text: string, page: ListPage): DefectDojoRequest {
  return {
    path: "/api/v2/products/",
    query: { tag: text, prefetch: "prod_type", o: "id", limit: page.limit, offset: page.offset },
  };
}

/**
 * Tests that carry every tag of `tagFilter` and, with `anyTagFilter`, one of its tags, with their engagement,
 * product and Product Type, in a stable order for paging.
 */
export function testsRequest(
  filter: { tagFilter: string; anyTagFilter?: string; branchTag?: string; scanType?: string },
  page: ListPage
): DefectDojoRequest {
  return {
    path: "/api/v2/tests/",
    query: {
      tags__and: filter.tagFilter,
      tags: filter.anyTagFilter,
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

export function productTypeRequest(name: string): DefectDojoRequest {
  return { path: "/api/v2/product_types/", query: { name } };
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

/** A findings scope whose tags are already tag filter values (`toTagFilter`). */
export type FindingsRequestScope = DefectDojoScope | { testTags: { all: string; any?: string } };

export interface FindingsRequestFilter {
  scope: FindingsRequestScope;
  /** Prefetch the test of each finding. */
  withTests?: boolean;
  /** Findings of the products of this Product Type only. A scope of product or test ids holds it already. */
  productTypeId?: number;
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

function findingsScopeParams(scope: FindingsRequestScope): DefectDojoRequest["query"] {
  if ("testId" in scope) {
    return { test: scope.testId };
  }
  if ("productIds" in scope) {
    return { product: scope.productIds.join(",") };
  }
  return { test__tags__and: scope.testTags.all, test__tags: scope.testTags.any };
}

/** One page of findings, most severe first, with the ids of their test, engagement and product. */
export function findingsRequest(filter: FindingsRequestFilter): DefectDojoRequest {
  return {
    path: "/api/v2/findings/",
    query: {
      ...findingsScopeParams(filter.scope),
      prefetch: filter.withTests ? "test" : undefined,
      ...(filter.state === "any" ? {} : FINDING_STATE_PARAMS[filter.state]),
      prod_type: filter.productTypeId,
      duplicate: false,
      severity: filter.severities.length > 0 ? filter.severities.join(",") : undefined,
      test__test_type: filter.testTypeIds.length > 0 ? filter.testTypeIds.join(",") : undefined,
      vulnerability_id: filter.vulnerabilityId || undefined,
      component_name: filter.component || undefined,
      o: "numerical_severity,id",
      related_fields: true,
      limit: filter.limit,
      offset: filter.offset,
    },
  };
}
