import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTableSettings } from "./useTableSettings";
import { TABLE_SETTINGS_KEY, readTableSettings as read, seedTableSettings as seed } from "../../../testUtils";

const settingsFor = (tableId: string) => renderHook(() => useTableSettings(tableId)).result.current;

describe("useTableSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadSettings", () => {
    it("returns an empty object when nothing is stored", () => {
      expect(settingsFor("pipelineRuns").loadSettings()).toEqual({});
    });

    it("returns only this table's slice", () => {
      seed({
        pipelineRuns: { run: { id: "run", width: 500 } },
        pipelines: { name: { id: "name", show: false } },
      });

      expect(settingsFor("pipelineRuns").loadSettings()).toEqual({ run: { id: "run", width: 500 } });
    });

    it("returns an empty object when the stored payload is corrupt", () => {
      localStorage.setItem(TABLE_SETTINGS_KEY, "{ not json");
      expect(settingsFor("pipelineRuns").loadSettings()).toEqual({});
    });
  });

  describe("patchColumnSettings", () => {
    it("creates an entry with its id and no invented show", () => {
      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: 500 } });

      expect(read().pipelineRuns.run).toEqual({ id: "run", width: 500 });
    });

    it("keeps a sibling width when only show is patched", () => {
      seed({ pipelineRuns: { run: { id: "run", width: 500 } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: { show: false } });

      expect(read().pipelineRuns.run).toEqual({ id: "run", show: false, width: 500 });
    });

    it("keeps a sibling show when only width is patched", () => {
      seed({ pipelineRuns: { run: { id: "run", show: false } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: 500 } });

      expect(read().pipelineRuns.run).toEqual({ id: "run", show: false, width: 500 });
    });

    it("leaves other columns of the same table alone", () => {
      seed({ pipelineRuns: { run: { id: "run", width: 500 }, status: { id: "status", show: false } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: 900 } });

      expect(read().pipelineRuns.status).toEqual({ id: "status", show: false });
    });

    it("leaves other tables alone", () => {
      seed({ pipelines: { name: { id: "name", width: 300 } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: 500 } });

      expect(read().pipelines).toEqual({ name: { id: "name", width: 300 } });
    });

    it("deletes only width when width is null", () => {
      seed({ pipelineRuns: { run: { id: "run", show: false, width: 500 } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: null } });

      expect(read().pipelineRuns.run).toEqual({ id: "run", show: false });
    });

    it("treats an absent key as leave-alone, unlike null", () => {
      seed({ pipelineRuns: { run: { id: "run", width: 500 } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: {} });

      expect(read().pipelineRuns.run).toEqual({ id: "run", width: 500 });
    });

    it("removes an entry left carrying nothing but its id", () => {
      seed({ pipelineRuns: { run: { id: "run", width: 500 }, status: { id: "status", show: false } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: null } });

      expect(read().pipelineRuns.run).toBeUndefined();
      expect(read().pipelineRuns.status).toBeDefined();
    });

    it("removes the table entry once its last column is cleared", () => {
      seed({ pipelineRuns: { run: { id: "run", width: 500 } }, pipelines: { name: { id: "name", width: 300 } } });

      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: null } });

      expect(read().pipelineRuns).toBeUndefined();
      expect(read().pipelines).toBeDefined();
    });

    it("applies several columns in one write", () => {
      settingsFor("pipelineRuns").patchColumnSettings({
        run: { width: 500 },
        status: { show: false },
        branch: { width: 200, show: true },
      });

      expect(read().pipelineRuns).toEqual({
        run: { id: "run", width: 500 },
        status: { id: "status", show: false },
        branch: { id: "branch", show: true, width: 200 },
      });
    });

    it("starts from an empty slice when the stored payload is corrupt", () => {
      localStorage.setItem(TABLE_SETTINGS_KEY, "{ not json");

      settingsFor("pipelineRuns").patchColumnSettings({ run: { width: 500 } });

      expect(read().pipelineRuns.run).toEqual({ id: "run", width: 500 });
    });

    it("round-trips through loadSettings", () => {
      const { patchColumnSettings, loadSettings } = settingsFor("pipelineRuns");

      patchColumnSettings({ run: { width: 500 } });

      expect(loadSettings()).toEqual({ run: { id: "run", width: 500 } });
    });
  });
});
