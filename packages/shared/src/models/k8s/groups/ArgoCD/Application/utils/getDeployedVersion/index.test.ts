import { describe, expect, it } from "vitest";
import { getDeployedVersion } from "./index.js";

describe("getDeployedVersion", () => {
  it("should return 'NaN' when application is undefined", () => {
    expect(getDeployedVersion(false, false, undefined)).toBe("NaN");
    expect(getDeployedVersion(true, true, undefined)).toBe("NaN");
  });

  describe("withValuesOverride = true", () => {
    it("should return targetRevision for helm source when isHelm = true", () => {
      const app = {
        spec: {
          sources: [{ helm: { parameters: [] }, targetRevision: "charts/1.2.3" }],
        },
      } as any;

      expect(getDeployedVersion(true, true, app)).toBe("1.2.3");
    });

    it("should return image.tag parameter value when isHelm = false", () => {
      const app = {
        spec: {
          sources: [
            {
              helm: {
                parameters: [{ name: "image.tag", value: "v1.0.0" }],
              },
              targetRevision: "main",
            },
          ],
        },
      } as any;

      expect(getDeployedVersion(true, false, app)).toBe("v1.0.0");
    });

    it("should handle missing sources", () => {
      const app = { spec: {} } as any;
      expect(getDeployedVersion(true, true, app)).toBeUndefined();
    });
  });

  describe("withValuesOverride = false", () => {
    it("should return targetRevision for helm when isHelm = true", () => {
      const app = {
        spec: {
          source: {
            targetRevision: "charts/2.0.0",
            helm: { parameters: [] },
          },
        },
      } as any;

      expect(getDeployedVersion(false, true, app)).toBe("2.0.0");
    });

    it("should return image.tag from source.helm.parameters when isHelm = false", () => {
      const app = {
        spec: {
          source: {
            helm: {
              parameters: [{ name: "image.tag", value: "v3.0.0" }],
            },
          },
        },
      } as any;

      expect(getDeployedVersion(false, false, app)).toBe("v3.0.0");
    });

    it("should return empty string when no matching parameter", () => {
      const app = {
        spec: {
          source: {
            helm: {
              parameters: [{ name: "other.param", value: "val" }],
            },
          },
        },
      } as any;

      expect(getDeployedVersion(false, false, app)).toBe("");
    });

    it("should return empty string when source is missing", () => {
      const app = { spec: {} } as any;

      expect(getDeployedVersion(false, true, app)).toBe("");
      expect(getDeployedVersion(false, false, app)).toBe("");
    });
  });
});
