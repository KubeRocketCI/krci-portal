import { describe, expect, it } from "vitest";
import { isSensitiveEnvKey, maskEnvValue } from "./env-utils.js";

describe("env-utils", () => {
  describe("isSensitiveEnvKey", () => {
    it("should return true for keys containing sensitive patterns", () => {
      expect(isSensitiveEnvKey("SERVER_SECRET")).toBe(true);
      expect(isSensitiveEnvKey("DB_PASSWORD")).toBe(true);
      expect(isSensitiveEnvKey("API_TOKEN")).toBe(true);
      expect(isSensitiveEnvKey("PRIVATE_KEY")).toBe(true);
      expect(isSensitiveEnvKey("OIDC_CLIENT_SECRET")).toBe(true);
    });

    it("should be case insensitive", () => {
      expect(isSensitiveEnvKey("secret")).toBe(true);
      expect(isSensitiveEnvKey("PASSWORD")).toBe(true);
    });

    it("should return false for non-sensitive keys", () => {
      expect(isSensitiveEnvKey("PORT")).toBe(false);
      expect(isSensitiveEnvKey("NODE_ENV")).toBe(false);
      expect(isSensitiveEnvKey("API_PREFIX")).toBe(false);
    });
  });

  describe("maskEnvValue", () => {
    it("should return <not set> for undefined", () => {
      expect(maskEnvValue("ANY_KEY", undefined)).toBe("<not set>");
    });

    it("should return <empty> for empty string", () => {
      expect(maskEnvValue("ANY_KEY", "")).toBe("<empty>");
    });

    it("should mask sensitive keys", () => {
      expect(maskEnvValue("SERVER_SECRET", "my-secret")).toBe("******");
      expect(maskEnvValue("PASSWORD", "pass123")).toBe("******");
    });

    it("should return value as-is for non-sensitive keys", () => {
      expect(maskEnvValue("PORT", "3000")).toBe("3000");
      expect(maskEnvValue("API_PREFIX", "/api")).toBe("/api");
    });
  });
});
