import { PLATFORM_LIST_DEFAULT_PAGE_SIZE, SCAN_FINDINGS_MAX_PAGE } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { toPageRequest } from "./searchParams";

describe("toPageRequest", () => {
  it("asks for the first page of the default size when the URL says nothing", () => {
    expect(toPageRequest(undefined, undefined)).toEqual({ page: 0, pageSize: PLATFORM_LIST_DEFAULT_PAGE_SIZE });
  });

  it("asks for the 0-based page of the 1-based URL page, at most the last page a list can ask for", () => {
    expect(toPageRequest(3, 50)).toEqual({ page: 2, pageSize: 50 });
    expect(toPageRequest(SCAN_FINDINGS_MAX_PAGE + 10, 50).page).toBe(SCAN_FINDINGS_MAX_PAGE);
  });
});
