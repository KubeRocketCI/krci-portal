import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTours, useAutoTour } from "./hooks";
import { ToursProvider } from "./provider";
import type { TourMetadata } from "../types";

vi.mock("../services", () => ({
  isTourCompleted: vi.fn(() => false),
  markTourCompleted: vi.fn(),
}));

vi.mock("react-joyride", () => ({
  default: () => null,
  ACTIONS: {},
  EVENTS: {},
  STATUS: {},
}));

vi.mock("../config", () => ({
  TOURS_CONFIG: {},
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: vi.fn(() => ({
    clusterName: "test-cluster",
  })),
}));

describe("Tours Provider Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useTours", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTours());
      }).toThrow("useTours must be used within ToursProvider");

      consoleSpy.mockRestore();
    });

    it("should return tours context when used within provider", () => {
      const { result } = renderHook(() => useTours(), {
        wrapper: ToursProvider,
      });

      expect(result.current).toHaveProperty("startTour");
      expect(result.current).toHaveProperty("skipTour");
      expect(result.current).toHaveProperty("isTourCompleted");
      expect(result.current).toHaveProperty("isRunning");
      expect(result.current).toHaveProperty("setOnTourEnd");
      expect(result.current.isRunning).toBe(false);
    });

    it("should update isRunning when tour starts", () => {
      const { result } = renderHook(() => useTours(), {
        wrapper: ToursProvider,
      });

      const mockTour: TourMetadata = {
        id: "test-tour",
        title: "Test Tour",
        description: "Test description",
        showOnce: false,
        trigger: "route",
        steps: [
          {
            target: "body",
            content: "Test step",
          },
        ],
      };

      expect(result.current.isRunning).toBe(false);

      act(() => {
        result.current.startTour(mockTour.id, mockTour);
      });

      expect(result.current.isRunning).toBe(true);
    });
  });

  describe("useAutoTour", () => {
    const mockTour: TourMetadata = {
      id: "test-tour",
      title: "Test Tour",
      description: "Test description",
      showOnce: false,
      trigger: "route",
      steps: [
        {
          target: "body",
          content: "Test step",
        },
      ],
    };

    it("should not start tour when tour is null", () => {
      const { result } = renderHook(
        () => {
          const tours = useTours();
          useAutoTour(null);
          return tours;
        },
        {
          wrapper: ToursProvider,
        }
      );

      expect(result.current.isRunning).toBe(false);
    });

    it("should cleanup timer on unmount", () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      const { unmount } = renderHook(
        () => {
          const tours = useTours();
          useAutoTour(mockTour, 100);
          return tours;
        },
        {
          wrapper: ToursProvider,
        }
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
