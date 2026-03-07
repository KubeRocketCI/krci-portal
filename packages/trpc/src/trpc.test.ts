import { describe, it, expect } from "vitest";
import { formatError } from "./trpc.js";

describe("formatError", () => {
  const baseShape = {
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
});
