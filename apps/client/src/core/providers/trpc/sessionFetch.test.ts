import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionFetch } from "./sessionFetch";

describe("createSessionFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches the session cookie and forwards the request", async () => {
    const response = new Response("{}", { status: 200 });
    fetchMock.mockResolvedValue(response);
    const onAuthError = vi.fn();

    const result = await createSessionFetch({ onAuthError })("/api", { method: "POST", body: "{}" });

    expect(fetchMock).toHaveBeenCalledWith("/api", { method: "POST", body: "{}", credentials: "include" });
    expect(result).toBe(response);
    expect(onAuthError).not.toHaveBeenCalled();
  });

  it("reports a bare 401 without reading the body", async () => {
    const response = new Response("unauthorized", { status: 401 });
    fetchMock.mockResolvedValue(response);
    const onAuthError = vi.fn();

    const result = await createSessionFetch({ onAuthError })("/api");

    expect(onAuthError).toHaveBeenCalledTimes(1);
    expect(result).toBe(response);
    expect(result.bodyUsed).toBe(false);
  });
});
