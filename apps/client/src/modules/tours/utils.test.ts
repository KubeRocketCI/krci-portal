import { describe, it, expect, vi } from "vitest";
import { isTourEligible } from "./utils";
import type { TourActivationContext, TourMetadata } from "./types";

vi.mock("./config", () => ({ TOURS_CONFIG: {} }));
vi.mock("@/core/router", () => ({
  router: { state: { location: { pathname: "/", search: {} } } },
}));

function makeTour(overrides: Partial<TourMetadata> = {}): TourMetadata {
  return {
    id: "test",
    title: "Test",
    description: "Test tour",
    showOnce: false,
    trigger: "manual",
    steps: [{ target: "body", content: "step" }],
    ...overrides,
  };
}

function makeContext(overrides: Partial<TourActivationContext> = {}): TourActivationContext {
  return {
    path: "/",
    params: {},
    search: {},
    ...overrides,
  };
}

describe("isTourEligible", () => {
  it("should return true when tour has no prerequisite", () => {
    const tour = makeTour();
    expect(isTourEligible(tour, makeContext())).toBe(true);
  });

  describe("routePattern matching", () => {
    it("should match exact route", () => {
      const tour = makeTour({ prerequisite: { routePattern: "/home" } });
      expect(isTourEligible(tour, makeContext({ path: "/home" }))).toBe(true);
    });

    it("should match parameterized route", () => {
      const tour = makeTour({
        prerequisite: { routePattern: "/c/:clusterName/projects/:namespace/:name" },
      });
      expect(isTourEligible(tour, makeContext({ path: "/c/my-cluster/projects/default/my-app" }))).toBe(true);
    });

    it("should reject non-matching route", () => {
      const tour = makeTour({ prerequisite: { routePattern: "/home" } });
      expect(isTourEligible(tour, makeContext({ path: "/settings" }))).toBe(false);
    });

    it("should reject route with different segment count", () => {
      const tour = makeTour({ prerequisite: { routePattern: "/a/b" } });
      expect(isTourEligible(tour, makeContext({ path: "/a/b/c" }))).toBe(false);
    });

    it("should handle trailing slashes via filter(Boolean)", () => {
      const tour = makeTour({ prerequisite: { routePattern: "/home/" } });
      expect(isTourEligible(tour, makeContext({ path: "/home" }))).toBe(true);
    });
  });

  describe("requiredSearch", () => {
    it("should match search params as object", () => {
      const tour = makeTour({
        prerequisite: { requiredSearch: { tab: "overview" } },
      });
      expect(isTourEligible(tour, makeContext({ search: { tab: "overview" } }))).toBe(true);
    });

    it("should reject when search param does not match", () => {
      const tour = makeTour({
        prerequisite: { requiredSearch: { tab: "overview" } },
      });
      expect(isTourEligible(tour, makeContext({ search: { tab: "branches" } }))).toBe(false);
    });

    it("should support function form for requiredSearch", () => {
      const tour = makeTour({
        prerequisite: {
          requiredSearch: (search) => search.tab === "overview",
        },
      });
      expect(isTourEligible(tour, makeContext({ search: { tab: "overview" } }))).toBe(true);
      expect(isTourEligible(tour, makeContext({ search: { tab: "branches" } }))).toBe(false);
    });
  });

  describe("validator", () => {
    it("should accept when validator returns true", () => {
      const tour = makeTour({
        prerequisite: { validator: () => true },
      });
      expect(isTourEligible(tour, makeContext())).toBe(true);
    });

    it("should reject when validator returns false", () => {
      const tour = makeTour({
        prerequisite: { validator: () => false },
      });
      expect(isTourEligible(tour, makeContext())).toBe(false);
    });
  });

  describe("combined prerequisites", () => {
    it("should require all three layers to pass", () => {
      const tour = makeTour({
        prerequisite: {
          routePattern: "/home",
          requiredSearch: { tab: "overview" },
          validator: () => true,
        },
      });
      expect(isTourEligible(tour, makeContext({ path: "/home", search: { tab: "overview" } }))).toBe(true);
    });

    it("should reject when route matches but search does not", () => {
      const tour = makeTour({
        prerequisite: {
          routePattern: "/home",
          requiredSearch: { tab: "overview" },
        },
      });
      expect(isTourEligible(tour, makeContext({ path: "/home", search: { tab: "branches" } }))).toBe(false);
    });

    it("should reject when route and search match but validator fails", () => {
      const tour = makeTour({
        prerequisite: {
          routePattern: "/home",
          requiredSearch: { tab: "overview" },
          validator: () => false,
        },
      });
      expect(isTourEligible(tour, makeContext({ path: "/home", search: { tab: "overview" } }))).toBe(false);
    });
  });
});
