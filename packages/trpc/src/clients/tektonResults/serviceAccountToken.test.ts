import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockReadFileSync = vi.fn();

vi.mock("node:fs", () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

describe("readServiceAccountToken", () => {
  beforeEach(() => {
    vi.resetModules();
    mockReadFileSync.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads and trims the default projected token path", async () => {
    mockReadFileSync.mockReturnValue("the-token\n");
    const { readServiceAccountToken } = await import("./serviceAccountToken.js");

    expect(readServiceAccountToken()).toBe("the-token");
    expect(mockReadFileSync).toHaveBeenCalledWith("/var/run/secrets/kubernetes.io/serviceaccount/token", "utf8");
  });

  it("returns null, not a throw, when no token is mounted (local development)", async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });
    const { readServiceAccountToken } = await import("./serviceAccountToken.js");

    expect(readServiceAccountToken()).toBeNull();
  });

  it("does not cache a failed read", async () => {
    mockReadFileSync
      .mockImplementationOnce(() => {
        throw new Error("ENOENT");
      })
      .mockReturnValueOnce("the-token");
    const { readServiceAccountToken } = await import("./serviceAccountToken.js");

    expect(readServiceAccountToken()).toBeNull();
    expect(readServiceAccountToken()).toBe("the-token");
  });

  it("returns null for an empty or whitespace-only file and does not cache it", async () => {
    mockReadFileSync.mockReturnValueOnce(" \n").mockReturnValueOnce("the-token");
    const { readServiceAccountToken } = await import("./serviceAccountToken.js");

    expect(readServiceAccountToken()).toBeNull();
    expect(readServiceAccountToken()).toBe("the-token");
  });

  it("caches the token and does not re-read on every call", async () => {
    mockReadFileSync.mockReturnValue("the-token");
    const { readServiceAccountToken } = await import("./serviceAccountToken.js");

    readServiceAccountToken();
    readServiceAccountToken();

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
  });

  it("re-reads the token after the cache expires", async () => {
    vi.useFakeTimers();
    mockReadFileSync.mockReturnValueOnce("old-token").mockReturnValueOnce("new-token");
    const { readServiceAccountToken } = await import("./serviceAccountToken.js");

    expect(readServiceAccountToken()).toBe("old-token");
    vi.advanceTimersByTime(61_000);
    expect(readServiceAccountToken()).toBe("new-token");
  });

  it("returns null after expiry when the token file disappears", async () => {
    vi.useFakeTimers();
    mockReadFileSync.mockReturnValueOnce("old-token").mockImplementationOnce(() => {
      throw new Error("ENOENT");
    });
    const { readServiceAccountToken } = await import("./serviceAccountToken.js");

    expect(readServiceAccountToken()).toBe("old-token");
    vi.advanceTimersByTime(61_000);
    expect(readServiceAccountToken()).toBeNull();
  });
});
