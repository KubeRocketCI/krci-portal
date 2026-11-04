import { describe, it, expect } from "vitest";
import type { TRPCDefaultErrorShape } from "@trpc/server";
import { HttpStatusError } from "./clients/http/index.js";
import { formatError } from "./trpc.js";

describe("formatError", () => {
  const baseShape: TRPCDefaultErrorShape = {
    code: -32003,
    data: { code: "FORBIDDEN", httpStatus: 403 },
    message: "test error",
  };

  it("should include source from cause when present", () => {
    const result = formatError({
      shape: baseShape,
      error: { cause: { source: "k8s", statusCode: 401 } },
    });

    expect(result.data.source).toBe("k8s");
    expect(result.data.code).toBe("FORBIDDEN");
    expect(result.data.httpStatus).toBe(403);
  });

  it("should set source to undefined when cause has no source", () => {
    const result = formatError({
      shape: baseShape,
      error: { cause: { statusCode: 500 } },
    });

    expect(result.data.source).toBeUndefined();
  });

  it("should set source to undefined when cause is undefined", () => {
    const result = formatError({
      shape: baseShape,
      error: {},
    });

    expect(result.data.source).toBeUndefined();
    expect(result.data.code).toBe("FORBIDDEN");
  });

  describe("problemDetail", () => {
    const detail = "The operation is not supported for this git server.";

    function statusError(status: number) {
      return new HttpStatusError({
        service: "GitFusion",
        url: "https://gitfusion.example.com/api/v1/pull-requests",
        status,
        statusText: "Status",
        body: JSON.stringify({ detail }),
        problemDetail: detail,
      });
    }

    function shapeWith(httpStatus: number): TRPCDefaultErrorShape {
      return { ...baseShape, data: { ...baseShape.data, httpStatus } };
    }

    it("is exposed when the tRPC status is 4xx", () => {
      const result = formatError({ shape: shapeWith(400), error: { cause: statusError(400) } });

      expect(result.data.problemDetail).toBe(detail);
    });

    it("is withheld for a 5xx answer", () => {
      const result = formatError({ shape: shapeWith(500), error: { cause: statusError(500) } });

      expect(result.data.problemDetail).toBeUndefined();
    });

    it("is withheld for an upstream 4xx that maps to a tRPC 500", () => {
      const result = formatError({ shape: shapeWith(500), error: { cause: statusError(422) } });

      expect(result.data.problemDetail).toBeUndefined();
    });

    it("is undefined for a non-HTTP cause", () => {
      const result = formatError({ shape: baseShape, error: { cause: new Error("boom") } });

      expect(result.data.problemDetail).toBeUndefined();
    });
  });

  describe("requestId", () => {
    function statusError(requestId?: string) {
      return new HttpStatusError({
        service: "GitFusion",
        url: "https://gitfusion.example.com/api/v1/branches",
        status: 502,
        statusText: "Bad Gateway",
        body: "",
        requestId,
      });
    }

    it("is taken from an HttpStatusError cause", () => {
      const result = formatError({
        shape: baseShape,
        error: { cause: statusError("gf-pod/abc123-000042") },
      });

      expect(result.data.requestId).toBe("gf-pod/abc123-000042");
    });

    it("is taken from an HttpStatusError nested one level down the cause chain", () => {
      const wrapper = new Error("wrapper", { cause: statusError("gf-pod/def456-000007") });

      const result = formatError({
        shape: baseShape,
        error: { cause: wrapper },
      });

      expect(result.data.requestId).toBe("gf-pod/def456-000007");
    });

    it.each([
      ["an HttpStatusError without a request id", { cause: statusError() }],
      ["a non-HTTP cause", { cause: new Error("boom") }],
      ["no cause", {}],
    ])("is undefined for %s", (_, error) => {
      const result = formatError({ shape: baseShape, error });

      expect(result.data.requestId).toBeUndefined();
    });
  });
});
