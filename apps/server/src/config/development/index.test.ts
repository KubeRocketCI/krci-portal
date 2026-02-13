import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { LocalFastifyServer } from "./index.js";

describe("LocalFastifyServer", () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateRequiredEnv", () => {
    it("should not throw when all required keys are set", () => {
      expect(() =>
        LocalFastifyServer.validateRequiredEnv(requiredKeys)
      ).not.toThrow();
    });

    it("should throw when a required key is missing", () => {
      delete process.env.OIDC_ISSUER_URL;

      expect(() =>
        LocalFastifyServer.validateRequiredEnv(requiredKeys)
      ).toThrow("Missing required OIDC_ISSUER_URL environment variable");
    });

    it("should throw when a required key is empty string", () => {
      process.env.SERVER_PORT = "";

      expect(() =>
        LocalFastifyServer.validateRequiredEnv(["SERVER_PORT"])
      ).toThrow("Missing required SERVER_PORT environment variable");
    });

    it("should log each key value when validating", () => {
      LocalFastifyServer.validateRequiredEnv(["API_PREFIX"]);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/^API_PREFIX:/)
      );
    });
  });
});
