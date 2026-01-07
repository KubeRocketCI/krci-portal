import { describe, it, expect } from "vitest";
import { getRiskScoreBadgeVariant, RISK_SCORE_THRESHOLDS } from "./utils";

describe("DependencyTrackMetricsWidget utils", () => {
  describe("RISK_SCORE_THRESHOLDS", () => {
    it("should define correct threshold values", () => {
      expect(RISK_SCORE_THRESHOLDS.HIGH).toBe(7);
      expect(RISK_SCORE_THRESHOLDS.MEDIUM).toBe(4);
    });
  });

  describe("getRiskScoreBadgeVariant", () => {
    describe("high risk (>= 7)", () => {
      it("should return destructive for score exactly at high threshold", () => {
        expect(getRiskScoreBadgeVariant(7)).toBe("destructive");
      });

      it("should return destructive for score above high threshold", () => {
        expect(getRiskScoreBadgeVariant(7.5)).toBe("destructive");
        expect(getRiskScoreBadgeVariant(8.0)).toBe("destructive");
        expect(getRiskScoreBadgeVariant(9.9)).toBe("destructive");
        expect(getRiskScoreBadgeVariant(10)).toBe("destructive");
      });
    });

    describe("medium risk (>= 4 and < 7)", () => {
      it("should return default for score exactly at medium threshold", () => {
        expect(getRiskScoreBadgeVariant(4)).toBe("default");
      });

      it("should return default for score in medium range", () => {
        expect(getRiskScoreBadgeVariant(4.5)).toBe("default");
        expect(getRiskScoreBadgeVariant(5.0)).toBe("default");
        expect(getRiskScoreBadgeVariant(6.0)).toBe("default");
        expect(getRiskScoreBadgeVariant(6.9)).toBe("default");
      });
    });

    describe("low risk (< 4)", () => {
      it("should return secondary for score below medium threshold", () => {
        expect(getRiskScoreBadgeVariant(0)).toBe("secondary");
        expect(getRiskScoreBadgeVariant(1.5)).toBe("secondary");
        expect(getRiskScoreBadgeVariant(2.0)).toBe("secondary");
        expect(getRiskScoreBadgeVariant(3.9)).toBe("secondary");
      });
    });

    describe("edge cases", () => {
      it("should handle negative scores", () => {
        expect(getRiskScoreBadgeVariant(-1)).toBe("secondary");
      });

      it("should handle very high scores", () => {
        expect(getRiskScoreBadgeVariant(100)).toBe("destructive");
      });

      it("should handle decimal precision", () => {
        expect(getRiskScoreBadgeVariant(6.99999)).toBe("default");
        expect(getRiskScoreBadgeVariant(7.00001)).toBe("destructive");
        expect(getRiskScoreBadgeVariant(3.99999)).toBe("secondary");
        expect(getRiskScoreBadgeVariant(4.00001)).toBe("default");
      });
    });
  });
});
