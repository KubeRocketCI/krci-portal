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
