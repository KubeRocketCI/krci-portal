import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  createUsePermissionsHook,
  createUseWatchItemHook,
  createUseWatchListHook,
  createUseWatchListMultipleHook,
} from "./index";
import { usePermissions } from "../usePermissions";
import { useWatchItem } from "../useWatch/useWatchItem";
import { useWatchList } from "../useWatch/useWatchList";
import { useWatchListMultiple } from "../useWatch/useWatchListMultiple";
import type { K8sResourceConfig } from "@my-project/shared";

// Mock the hooks
vi.mock("../usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("../useWatch/useWatchItem", () => ({
  useWatchItem: vi.fn(),
}));

vi.mock("../useWatch/useWatchList", () => ({
  useWatchList: vi.fn(),
}));

vi.mock("../useWatch/useWatchListMultiple", () => ({
  useWatchListMultiple: vi.fn(),
}));

describe("hook-creators", () => {
  const mockResourceConfig: K8sResourceConfig = {
    apiVersion: "test.group/v1",
    kind: "Resource",
    group: "test.group",
    version: "v1",
    singularName: "resource",
    pluralName: "resources",
  };

  describe("createUsePermissionsHook", () => {
    it("should create a hook that calls usePermissions with correct config", () => {
      const mockPermissions = { create: { allowed: true, reason: "" } };
      vi.mocked(usePermissions).mockReturnValue({
        data: mockPermissions,
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const usePermissionsHook = createUsePermissionsHook(mockResourceConfig);
      const { result } = renderHook(() => usePermissionsHook());

      expect(usePermissions).toHaveBeenCalledWith({
        group: "test.group",
        version: "v1",
        resourcePlural: "resources",
      });
      expect(result.current.data).toEqual(mockPermissions);
    });

    it("should work with different resource configs", () => {
      const differentConfig: K8sResourceConfig = {
        apiVersion: "other.group/v2",
        kind: "Item",
        group: "other.group",
        version: "v2",
        singularName: "item",
        pluralName: "items",
      };

      vi.mocked(usePermissions).mockReturnValue({
        data: { create: { allowed: false, reason: "" } },
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const usePermissionsHook = createUsePermissionsHook(differentConfig);
      renderHook(() => usePermissionsHook());

      expect(usePermissions).toHaveBeenCalledWith({
        group: "other.group",
        version: "v2",
        resourcePlural: "items",
      });
    });
  });

  describe("createUseWatchItemHook", () => {
    it("should create a hook that calls useWatchItem with resource config", () => {
      const mockItem = { metadata: { name: "test-item" } };
      vi.mocked(useWatchItem).mockReturnValue({
        data: mockItem,
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const useWatchItemHook = createUseWatchItemHook(mockResourceConfig);
      const params = { name: "test-item", namespace: "default" };
      const { result } = renderHook(() => useWatchItemHook(params));

      expect(useWatchItem).toHaveBeenCalledWith({
        resourceConfig: mockResourceConfig,
        ...params,
      });
      expect(result.current.data).toEqual(mockItem);
    });

    it("should pass through all params except resourceConfig", () => {
      const mockItem = { metadata: { name: "test" } };
      vi.mocked(useWatchItem).mockReturnValue({
        data: mockItem,
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const useWatchItemHook = createUseWatchItemHook(mockResourceConfig);
      const params = {
        name: "test-item",
        namespace: "default",
        enabled: true,
      };
      renderHook(() => useWatchItemHook(params));

      expect(useWatchItem).toHaveBeenCalledWith({
        resourceConfig: mockResourceConfig,
        name: "test-item",
        namespace: "default",
        enabled: true,
      });
    });
  });

  describe("createUseWatchListHook", () => {
    it("should create a hook that calls useWatchList with resource config", () => {
      const mockList = [{ metadata: { name: "item1" } }, { metadata: { name: "item2" } }];
      vi.mocked(useWatchList).mockReturnValue({
        data: mockList,
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const useWatchListHook = createUseWatchListHook(mockResourceConfig);
      const { result } = renderHook(() => useWatchListHook());

      expect(useWatchList).toHaveBeenCalledWith({
        resourceConfig: mockResourceConfig,
      });
      expect(result.current.data).toEqual(mockList);
    });

    it("should pass through optional params", () => {
      const mockList: unknown[] = [];
      vi.mocked(useWatchList).mockReturnValue({
        data: mockList,
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const useWatchListHook = createUseWatchListHook(mockResourceConfig);
      const params = { namespace: "default", enabled: false };
      renderHook(() => useWatchListHook(params));

      expect(useWatchList).toHaveBeenCalledWith({
        resourceConfig: mockResourceConfig,
        namespace: "default",
        enabled: false,
      });
    });

    it("should work without params", () => {
      vi.mocked(useWatchList).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const useWatchListHook = createUseWatchListHook(mockResourceConfig);
      renderHook(() => useWatchListHook());

      expect(useWatchList).toHaveBeenCalledWith({
        resourceConfig: mockResourceConfig,
      });
    });
  });

  describe("createUseWatchListMultipleHook", () => {
    it("should create a hook that calls useWatchListMultiple with resource config", () => {
      const mockList = [{ metadata: { name: "item1" } }];
      vi.mocked(useWatchListMultiple).mockReturnValue({
        data: mockList,
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const useWatchListMultipleHook = createUseWatchListMultipleHook(mockResourceConfig);
      const { result } = renderHook(() => useWatchListMultipleHook());

      expect(useWatchListMultiple).toHaveBeenCalledWith({
        resourceConfig: mockResourceConfig,
      });
      expect(result.current.data).toEqual(mockList);
    });

    it("should pass through optional params", () => {
      vi.mocked(useWatchListMultiple).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as never);

      const useWatchListMultipleHook = createUseWatchListMultipleHook(mockResourceConfig);
      const params = { namespaces: ["default", "test"], enabled: true };
      renderHook(() => useWatchListMultipleHook(params));

      expect(useWatchListMultiple).toHaveBeenCalledWith({
        resourceConfig: mockResourceConfig,
        namespaces: ["default", "test"],
        enabled: true,
      });
    });
  });
});
