import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ProductionFastifyServer } from "./index.js";

describe("ProductionFastifyServer", () => {
  const requiredKeys = [
    "API_PREFIX",
    "SERVER_SECRET",
    "SERVER_PORT",
    "OIDC_ISSUER_URL",
    "OIDC_CLIENT_ID",
    "OIDC_CLIENT_SECRET",
    "OIDC_SCOPE",
    "OIDC_CODE_CHALLENGE_METHOD",
    "PORTAL_URL",
    "TEKTON_RESULTS_URL",
  ];

  beforeEach(() => {
    requiredKeys.forEach((key) => {
      process.env[key] = "test-value";
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateRequiredEnv", () => {
    it("should not throw when all required keys are set", () => {
      expect(() =>
        ProductionFastifyServer.validateRequiredEnv(requiredKeys)
      ).not.toThrow();
    });

    it("should not throw when a key is missing (production only logs)", () => {
      delete process.env.OIDC_ISSUER_URL;

      expect(() =>
        ProductionFastifyServer.validateRequiredEnv(requiredKeys)
      ).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        "Missing required OIDC_ISSUER_URL environment variable"
      );
    });

    it("should log each key value when validating", () => {
      ProductionFastifyServer.validateRequiredEnv(["API_PREFIX"]);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/^API_PREFIX:/)
      );
    });
  });
});
