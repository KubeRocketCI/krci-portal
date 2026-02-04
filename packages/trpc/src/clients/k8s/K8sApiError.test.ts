import { describe, expect, test } from "vitest";
import { K8sApiError } from "@my-project/shared";

describe("K8sApiError", () => {
  test("creates error with all properties", () => {
    const error = new K8sApiError(404, "Not Found", "Resource not found");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(K8sApiError);
    expect(error.name).toBe("K8sApiError");
    expect(error.statusCode).toBe(404);
    expect(error.statusText).toBe("Not Found");
    expect(error.responseBody).toBe("Resource not found");
  });

  test("formats error message correctly", () => {
    const error = new K8sApiError(403, "Forbidden", "Access denied");

    expect(error.message).toBe("Kubernetes API request failed: 403 Forbidden. Access denied");
  });

  test("handles 500 error", () => {
    const error = new K8sApiError(500, "Internal Server Error", "Server error occurred");

    expect(error.statusCode).toBe(500);
    expect(error.statusText).toBe("Internal Server Error");
    expect(error.responseBody).toBe("Server error occurred");
  });

  test("handles 401 Unauthorized", () => {
    const error = new K8sApiError(401, "Unauthorized", "Invalid credentials");

    expect(error.statusCode).toBe(401);
    expect(error.statusText).toBe("Unauthorized");
    expect(error.message).toContain("401 Unauthorized");
  });

  test("handles empty response body", () => {
    const error = new K8sApiError(400, "Bad Request", "");

    expect(error.responseBody).toBe("");
    expect(error.message).toBe("Kubernetes API request failed: 400 Bad Request. ");
  });

  test("handles JSON response body", () => {
    const jsonResponse = JSON.stringify({ error: "Invalid resource", code: "INVALID" });
    const error = new K8sApiError(422, "Unprocessable Entity", jsonResponse);

    expect(error.responseBody).toBe(jsonResponse);
    expect(error.message).toContain("Unprocessable Entity");
    expect(error.message).toContain(jsonResponse);
  });

  test("handles long error messages", () => {
    const longMessage = "A".repeat(1000);
    const error = new K8sApiError(400, "Bad Request", longMessage);

    expect(error.responseBody).toBe(longMessage);
    expect(error.message).toContain("Bad Request");
  });

  test("preserves stack trace", () => {
    const error = new K8sApiError(500, "Internal Server Error", "Error details");

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("K8sApiError");
  });

  test("can be caught as Error", () => {
    try {
      throw new K8sApiError(404, "Not Found", "Resource not found");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(K8sApiError);
    }
  });

  test("can be caught and properties accessed", () => {
    try {
      throw new K8sApiError(403, "Forbidden", "Access denied");
    } catch (err) {
      expect(err).toBeInstanceOf(K8sApiError);
      const error = err as K8sApiError;
      expect(error.statusCode).toBe(403);
      expect(error.statusText).toBe("Forbidden");
      expect(error.responseBody).toBe("Access denied");
    }
  });

  test("handles special characters in response body", () => {
    const specialChars = 'Error: <html>&nbsp;"quotes"</html>';
    const error = new K8sApiError(400, "Bad Request", specialChars);

    expect(error.responseBody).toBe(specialChars);
  });

  test("handles unicode characters", () => {
    const unicode = "Error: 你好 🚀";
    const error = new K8sApiError(400, "Bad Request", unicode);

    expect(error.responseBody).toBe(unicode);
  });

  test("handles newlines in response body", () => {
    const multilineError = "Error line 1\nError line 2\nError line 3";
    const error = new K8sApiError(500, "Internal Server Error", multilineError);

    expect(error.responseBody).toBe(multilineError);
    expect(error.message).toContain(multilineError);
  });

  test("name property is set correctly", () => {
    const error = new K8sApiError(404, "Not Found", "");

    expect(error.name).toBe("K8sApiError");
    expect(Object.prototype.toString.call(error)).toBe("[object Error]");
  });

  test("handles various HTTP status codes", () => {
    const statusCodes = [200, 201, 301, 302, 400, 401, 403, 404, 422, 500, 502, 503];

    statusCodes.forEach((code) => {
      const error = new K8sApiError(code, `Status ${code}`, `Body for ${code}`);
      expect(error.statusCode).toBe(code);
      expect(error.message).toContain(`${code}`);
    });
  });
});
