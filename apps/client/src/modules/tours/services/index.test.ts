import { describe, it, expect, beforeEach, vi } from "vitest";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { LS_KEY_PORTAL_TOURS } from "@/core/services/local-storage/keys";
import {
  isTourCompleted,
  markTourCompleted,
  resetTour,
  resetAllTours,
  getFirstVisitDate,
  getCompletedTourIds,
} from "./index";
import type { ToursStorageData } from "../types";

vi.mock("@/core/services/local-storage", () => ({
  LOCAL_STORAGE_SERVICE: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("Tours Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isTourCompleted", () => {
    it("should return true when tour is completed", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {
          "tour-1": {
            completedAt: Date.now(),
            version: "2.1.0",
            completed: true,
          },
        },
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      expect(isTourCompleted("tour-1")).toBe(true);
    });

    it("should return false when tour is not completed", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {},
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      expect(isTourCompleted("tour-1")).toBe(false);
    });

    it("should initialize data when localStorage is empty", () => {
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(null);

      expect(isTourCompleted("tour-1")).toBe(false);
      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalled();
    });

    it("should initialize data when schema version is incorrect", () => {
      const mockData = {
        schemaVersion: 0,
        tours: {},
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      expect(isTourCompleted("tour-1")).toBe(false);
      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalled();
    });
  });

  describe("markTourCompleted", () => {
    it("should mark tour as completed", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {},
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      markTourCompleted("tour-1", true);

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        LS_KEY_PORTAL_TOURS,
        expect.objectContaining({
          schemaVersion: 1,
          tours: expect.objectContaining({
            "tour-1": expect.objectContaining({
              completed: true,
              version: "2.1.0",
            }),
          }),
        })
      );
    });

    it("should mark tour as incomplete", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {},
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      markTourCompleted("tour-1", false);

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        LS_KEY_PORTAL_TOURS,
        expect.objectContaining({
          tours: expect.objectContaining({
            "tour-1": expect.objectContaining({
              completed: false,
            }),
          }),
        })
      );
    });
  });

  describe("resetTour", () => {
    it("should remove tour from completed list", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {
          "tour-1": {
            completedAt: Date.now(),
            version: "2.1.0",
            completed: true,
          },
          "tour-2": {
            completedAt: Date.now(),
            version: "2.1.0",
            completed: true,
          },
        },
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      resetTour("tour-1");

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        LS_KEY_PORTAL_TOURS,
        expect.objectContaining({
          tours: {
            "tour-2": expect.any(Object),
          },
        })
      );
    });
  });

  describe("resetAllTours", () => {
    it("should remove all completed tours", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {
          "tour-1": {
            completedAt: Date.now(),
            version: "2.1.0",
            completed: true,
          },
          "tour-2": {
            completedAt: Date.now(),
            version: "2.1.0",
            completed: true,
          },
        },
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      resetAllTours();

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        LS_KEY_PORTAL_TOURS,
        expect.objectContaining({
          tours: {},
        })
      );
    });
  });

  describe("getFirstVisitDate", () => {
    it("should return first visit date", () => {
      const firstVisit = new Date().toISOString();
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {},
        firstVisit,
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      expect(getFirstVisitDate()).toBe(firstVisit);
    });

    it("should return undefined when no first visit date", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {},
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      expect(getFirstVisitDate()).toBeUndefined();
    });
  });

  describe("getCompletedTourIds", () => {
    it("should return array of completed tour IDs", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {
          "tour-1": {
            completedAt: Date.now(),
            version: "2.1.0",
            completed: true,
          },
          "tour-2": {
            completedAt: Date.now(),
            version: "2.1.0",
            completed: false,
          },
        },
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      const completedIds = getCompletedTourIds();
      expect(completedIds).toContain("tour-1");
      expect(completedIds).toContain("tour-2");
      expect(completedIds).toHaveLength(2);
    });

    it("should return empty array when no tours completed", () => {
      const mockData: ToursStorageData = {
        schemaVersion: 1,
        tours: {},
        firstVisit: new Date().toISOString(),
      };

      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(mockData);

      expect(getCompletedTourIds()).toEqual([]);
    });
  });
});
