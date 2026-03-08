import { describe, it, expect } from "vitest";
import { parseResultUidFromAnnotation, parseRecordName } from "./utils.js";

describe("parseResultUidFromAnnotation", () => {
  it("should extract resultUid from a valid annotation", () => {
    expect(parseResultUidFromAnnotation("edp-delivery/results/6a04af6a-3424-40f9-9d3d-033769a9abe5")).toBe(
      "6a04af6a-3424-40f9-9d3d-033769a9abe5"
    );
  });

  it("should handle different namespace values", () => {
    expect(parseResultUidFromAnnotation("my-namespace/results/abc-123")).toBe("abc-123");
  });

  it("should return null for empty string", () => {
    expect(parseResultUidFromAnnotation("")).toBeNull();
  });

  it("should return null when 'results' segment is missing", () => {
    expect(parseResultUidFromAnnotation("edp-delivery/records/abc-123")).toBeNull();
  });

  it("should return null when resultUid is missing after 'results/'", () => {
    expect(parseResultUidFromAnnotation("edp-delivery/results/")).toBeNull();
  });

  it("should return null when annotation has no path separator", () => {
    expect(parseResultUidFromAnnotation("just-a-string")).toBeNull();
  });

  it("should handle annotation with extra path segments (record format)", () => {
    // If given a full record path, it should still extract the resultUid
    expect(parseResultUidFromAnnotation("edp-delivery/results/abc-123/records/def-456")).toBe("abc-123");
  });
});

describe("parseRecordName", () => {
  it("should extract both UIDs from a valid record name", () => {
    expect(parseRecordName("edp-delivery/results/abc-123/records/def-456")).toEqual({
      resultUid: "abc-123",
      recordUid: "def-456",
    });
  });

  it("should return null for invalid format", () => {
    expect(parseRecordName("invalid")).toBeNull();
  });
});
