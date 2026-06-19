import { describe, expect, it } from "vitest";
import { parseEnvoyClusterName, aggregateExposure } from "./utils.js";

describe("parseEnvoyClusterName", () => {
  it("parses a real non-mirror httproute cluster name", () => {
    const result = parseEnvoyClusterName("httproute/krci-demo-dev/test-go-app/rule/0");
    expect(result).toEqual({
      routeNamespace: "krci-demo-dev",
      routeName: "test-go-app",
      ruleIndex: 0,
      isMirror: false,
    });
  });

  it("parses a multi-rule index (rule/2)", () => {
    const result = parseEnvoyClusterName("httproute/krci-demo-dev/demo-headers/rule/2");
    expect(result).toEqual({
      routeNamespace: "krci-demo-dev",
      routeName: "demo-headers",
      ruleIndex: 2,
      isMirror: false,
    });
  });

  it("parses a mirror variant and sets isMirror=true", () => {
    const result = parseEnvoyClusterName("httproute/krci-demo-dev/demo-headers/rule/0-mirror-1");
    expect(result).toEqual({
      routeNamespace: "krci-demo-dev",
      routeName: "demo-headers",
      ruleIndex: 0,
      isMirror: true,
    });
  });

  it("returns null for a gateway-level cluster name (<ns>/<gw>)", () => {
    expect(parseEnvoyClusterName("krci-demo-dev/eg")).toBeNull();
  });

  it("returns null for junk input", () => {
    expect(parseEnvoyClusterName("totally-junk")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseEnvoyClusterName("")).toBeNull();
  });

  it("returns null for an incomplete httproute path (no rule segment)", () => {
    expect(parseEnvoyClusterName("httproute/ns/route")).toBeNull();
  });

  it("returns null for non-string (defensive cast)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseEnvoyClusterName(undefined as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseEnvoyClusterName(null as any)).toBeNull();
  });

  it("never throws for arbitrary strings", () => {
    const inputs = ["", "///", "httproute/", "httproute/a/b/rule/x", "a|b.c*d"];
    for (const input of inputs) {
      expect(() => parseEnvoyClusterName(input)).not.toThrow();
    }
  });
});

describe("aggregateExposure", () => {
  const series = (name: string, v: string): { metric: Record<string, string>; value: [number, string] } => ({
    metric: { envoy_cluster_name: name },
    value: [0, v],
  });

  it("aggregates two rps series for the same route from different rules — route-level entry sums them", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/my-route/rule/0", "3"), series("httproute/ns/my-route/rule/1", "2")],
      success: [],
    });
    const routeEntry = result.find((r) => r.key === "ns/my-route");
    expect(routeEntry).toBeDefined();
    expect(routeEntry?.rps).toBe(5);
  });

  it("emits per-rule entries for multi-rule route (rule/0 and rule/1 get separate keys)", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/my-route/rule/0", "3"), series("httproute/ns/my-route/rule/1", "2")],
      success: [],
    });
    // route-level + 2 per-rule = 3 total entries
    expect(result).toHaveLength(3);
    const rule0 = result.find((r) => r.key === "ns/my-route/0");
    const rule1 = result.find((r) => r.key === "ns/my-route/1");
    expect(rule0).toBeDefined();
    expect(rule0?.rps).toBe(3);
    expect(rule1).toBeDefined();
    expect(rule1?.rps).toBe(2);
  });

  it("single-rule route still emits both route-level and per-rule/0 entries", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/route/rule/0", "10")],
      success: [series("httproute/ns/route/rule/0", "9")],
    });
    expect(result).toHaveLength(2);
    const routeEntry = result.find((r) => r.key === "ns/route");
    const ruleEntry = result.find((r) => r.key === "ns/route/0");
    expect(routeEntry?.rps).toBe(10);
    expect(ruleEntry?.rps).toBe(10);
    expect(routeEntry?.successPct).toBeCloseTo(90);
    expect(ruleEntry?.successPct).toBeCloseTo(90);
  });

  it("excludes mirror backends from rps accumulation (both granularities)", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/my-route/rule/0", "10"), series("httproute/ns/my-route/rule/0-mirror-1", "5")],
      success: [],
    });
    const routeEntry = result.find((r) => r.key === "ns/my-route");
    const ruleEntry = result.find((r) => r.key === "ns/my-route/0");
    expect(routeEntry?.rps).toBe(10);
    expect(ruleEntry?.rps).toBe(10);
    // Mirror cluster must not produce its own per-rule entry
    const mirrorEntry = result.find((r) => r.key.includes("mirror"));
    expect(mirrorEntry).toBeUndefined();
  });

  it("computes successPct from success series", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/route/rule/0", "100")],
      success: [series("httproute/ns/route/rule/0", "90")],
    });
    const routeEntry = result.find((r) => r.key === "ns/route");
    expect(routeEntry?.successPct).toBeCloseTo(90);
  });

  it("defaults successPct to 100 when totalRps is zero", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/route/rule/0", "0")],
      success: [],
    });
    const routeEntry = result.find((r) => r.key === "ns/route");
    expect(routeEntry?.successPct).toBe(100);
  });

  it("clamps successPct to [0, 100] when success > rps (floating point edge)", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/route/rule/0", "1")],
      success: [series("httproute/ns/route/rule/0", "1.001")],
    });
    const routeEntry = result.find((r) => r.key === "ns/route");
    expect(routeEntry?.successPct).toBeLessThanOrEqual(100);
    expect(routeEntry?.successPct).toBeGreaterThanOrEqual(0);
  });

  it("treats non-numeric value strings as 0 (no throw)", () => {
    expect(() =>
      aggregateExposure({
        rps: [series("httproute/ns/route/rule/0", "NaN"), series("httproute/ns/route/rule/0", "bad")],
        success: [],
      })
    ).not.toThrow();
    const result = aggregateExposure({
      rps: [series("httproute/ns/route/rule/0", "NaN")],
      success: [],
    });
    const routeEntry = result.find((r) => r.key === "ns/route");
    expect(routeEntry?.rps).toBe(0);
  });

  it("returns [] for empty input arrays", () => {
    expect(aggregateExposure({ rps: [], success: [] })).toEqual([]);
  });

  it("skips series whose cluster name is unparseable", () => {
    const result = aggregateExposure({
      rps: [
        { metric: { envoy_cluster_name: "krci-demo-dev/eg" }, value: [0, "999"] },
        series("httproute/ns/good-route/rule/0", "5"),
      ],
      success: [],
    });
    // good-route/rule/0 → 2 entries (route-level + per-rule); gateway name → 0 entries
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.key === "ns/good-route")).toBeDefined();
    expect(result.find((r) => r.key === "ns/good-route/0")).toBeDefined();
  });

  it("handles missing envoy_cluster_name label gracefully", () => {
    const result = aggregateExposure({
      rps: [{ metric: {}, value: [0, "10"] }],
      success: [],
    });
    expect(result).toEqual([]);
  });

  it("produces route-level and per-rule entries for two distinct routes", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/route-a/rule/0", "2"), series("httproute/ns/route-b/rule/0", "7")],
      success: [series("httproute/ns/route-a/rule/0", "2"), series("httproute/ns/route-b/rule/0", "6")],
    });
    // 2 routes × 2 granularities = 4 entries
    expect(result).toHaveLength(4);
    const a = result.find((r) => r.key === "ns/route-a");
    const b = result.find((r) => r.key === "ns/route-b");
    expect(a?.successPct).toBeCloseTo(100);
    expect(b?.successPct).toBeCloseTo((6 / 7) * 100);
  });

  it("per-rule successPct is independent for each rule index", () => {
    const result = aggregateExposure({
      rps: [series("httproute/ns/my-route/rule/0", "100"), series("httproute/ns/my-route/rule/1", "50")],
      success: [series("httproute/ns/my-route/rule/0", "80"), series("httproute/ns/my-route/rule/1", "50")],
    });
    const rule0 = result.find((r) => r.key === "ns/my-route/0");
    const rule1 = result.find((r) => r.key === "ns/my-route/1");
    expect(rule0?.successPct).toBeCloseTo(80);
    expect(rule1?.successPct).toBeCloseTo(100);
    // route-level: (80+50)/(100+50) = 130/150 ≈ 86.67%
    const routeEntry = result.find((r) => r.key === "ns/my-route");
    expect(routeEntry?.successPct).toBeCloseTo((130 / 150) * 100);
  });
});
