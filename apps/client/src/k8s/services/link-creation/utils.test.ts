import { describe, expect, test } from "vitest";
import { createURLObjectFromURLOrigin } from "./utils";

describe("createURLObjectFromURLOrigin", () => {
  test("creates URL object from valid HTTP URL", () => {
    const result = createURLObjectFromURLOrigin("http://example.com");

    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe("http://example.com/");
    expect(result.protocol).toBe("http:");
    expect(result.hostname).toBe("example.com");
  });

  test("creates URL object from valid HTTPS URL", () => {
    const result = createURLObjectFromURLOrigin("https://example.com");

    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe("https://example.com/");
    expect(result.protocol).toBe("https:");
  });

  test("creates URL object with port", () => {
    const result = createURLObjectFromURLOrigin("https://example.com:8080");

    expect(result.port).toBe("8080");
    expect(result.hostname).toBe("example.com");
  });

  test("creates URL object with path", () => {
    const result = createURLObjectFromURLOrigin("https://example.com/api/v1");

    expect(result.pathname).toBe("/api/v1");
  });

  test("creates URL object with query parameters", () => {
    const result = createURLObjectFromURLOrigin("https://example.com?key=value");

    expect(result.search).toBe("?key=value");
  });

  test("trims whitespace from URL", () => {
    const result = createURLObjectFromURLOrigin("  https://example.com  ");

    expect(result.href).toBe("https://example.com/");
  });

  test("handles localhost", () => {
    const result = createURLObjectFromURLOrigin("http://localhost:3000");

    expect(result.hostname).toBe("localhost");
    expect(result.port).toBe("3000");
  });

  test("handles IP addresses", () => {
    const result = createURLObjectFromURLOrigin("http://192.168.1.1");

    expect(result.hostname).toBe("192.168.1.1");
  });

  test("throws error for invalid URL", () => {
    expect(() => {
      createURLObjectFromURLOrigin("not-a-url");
    }).toThrow("Error while creating URL object");
  });

  test("throws error for empty string", () => {
    expect(() => {
      createURLObjectFromURLOrigin("");
    }).toThrow("Error while creating URL object");
  });

  test("throws error for URL without protocol", () => {
    expect(() => {
      createURLObjectFromURLOrigin("example.com");
    }).toThrow("Error while creating URL object");
  });

  test("handles URL with subdomain", () => {
    const result = createURLObjectFromURLOrigin("https://api.example.com");

    expect(result.hostname).toBe("api.example.com");
  });

  test("handles URL with hash", () => {
    const result = createURLObjectFromURLOrigin("https://example.com#section");

    expect(result.hash).toBe("#section");
  });

  test("handles URL with username and password", () => {
    const result = createURLObjectFromURLOrigin("https://user:pass@example.com");

    expect(result.username).toBe("user");
    expect(result.password).toBe("pass");
  });

  test("handles complex URL with all components", () => {
    const result = createURLObjectFromURLOrigin(
      "https://user:pass@api.example.com:8080/path/to/resource?query=value#section"
    );

    expect(result.protocol).toBe("https:");
    expect(result.username).toBe("user");
    expect(result.password).toBe("pass");
    expect(result.hostname).toBe("api.example.com");
    expect(result.port).toBe("8080");
    expect(result.pathname).toBe("/path/to/resource");
    expect(result.search).toBe("?query=value");
    expect(result.hash).toBe("#section");
  });

  test("handles URL with encoded characters", () => {
    const result = createURLObjectFromURLOrigin("https://example.com/path%20with%20spaces");

    expect(result.pathname).toBe("/path%20with%20spaces");
  });

  test("handles URL with multiple query parameters", () => {
    const result = createURLObjectFromURLOrigin("https://example.com?key1=value1&key2=value2");

    expect(result.search).toBe("?key1=value1&key2=value2");
  });
});
