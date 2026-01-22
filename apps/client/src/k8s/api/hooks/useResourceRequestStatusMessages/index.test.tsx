import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRequestStatusMessages } from "./index";
import { k8sOperation } from "@my-project/shared";

// Mock showToast
const mockShowToast = vi.fn();
vi.mock("@/core/components/Snackbar", () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

describe("useRequestStatusMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showBeforeRequestMessage", () => {
    it("should show default create message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showBeforeRequestMessage(k8sOperation.create, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Applying resource", "info", { duration: 2000 });
    });

    it("should show default patch message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showBeforeRequestMessage(k8sOperation.patch, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Patching resource", "info", { duration: 2000 });
    });

    it("should show default delete message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showBeforeRequestMessage(k8sOperation.delete, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Deleting resource", "info", { duration: 2000 });
    });

    it("should show custom entity name in create message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showBeforeRequestMessage(k8sOperation.create, { entityName: "MyResource" });
      });

      expect(mockShowToast).toHaveBeenCalledWith("Applying MyResource", "info", { duration: 2000 });
    });

    it("should show custom message when provided", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showBeforeRequestMessage(k8sOperation.create, {
          customMessage: {
            message: "Custom loading message",
            options: { duration: 3000 },
          },
        });
      });

      // Custom duration from options overrides default duration
      expect(mockShowToast).toHaveBeenCalledWith("Custom loading message", "info", { duration: 3000 });
    });

    it("should merge custom message options with default duration", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showBeforeRequestMessage(k8sOperation.create, {
          customMessage: {
            message: "Custom message",
            options: { route: { to: "/" } },
          },
        });
      });

      expect(mockShowToast).toHaveBeenCalledWith("Custom message", "info", {
        duration: 2000,
        route: { to: "/" },
      });
    });
  });

  describe("showRequestSuccessMessage", () => {
    it("should show default create success message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestSuccessMessage(k8sOperation.create, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Resource has been successfully applied", "success", {
        duration: 5000,
      });
    });

    it("should show default patch success message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestSuccessMessage(k8sOperation.patch, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Resource has been successfully patched", "success", {
        duration: 5000,
      });
    });

    it("should show default delete success message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestSuccessMessage(k8sOperation.delete, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Resource has been successfully deleted", "success", {
        duration: 5000,
      });
    });

    it("should show custom entity name in success message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestSuccessMessage(k8sOperation.create, { entityName: "MyResource" });
      });

      expect(mockShowToast).toHaveBeenCalledWith("MyResource has been successfully applied", "success", {
        duration: 5000,
      });
    });

    it("should show custom success message when provided", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestSuccessMessage(k8sOperation.create, {
          customMessage: {
            message: "Custom success message",
            options: { duration: 10000 },
          },
        });
      });

      expect(mockShowToast).toHaveBeenCalledWith("Custom success message", "success", { duration: 10000 });
    });
  });

  describe("showRequestErrorMessage", () => {
    it("should show default create error message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorMessage(k8sOperation.create, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Failed to apply resource", "error", { duration: 5000 });
    });

    it("should show default patch error message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorMessage(k8sOperation.patch, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Failed to patch resource", "error", { duration: 5000 });
    });

    it("should show default delete error message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorMessage(k8sOperation.delete, {});
      });

      expect(mockShowToast).toHaveBeenCalledWith("Failed to delete resource", "error", { duration: 5000 });
    });

    it("should show custom entity name in error message", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorMessage(k8sOperation.create, { entityName: "MyResource" });
      });

      expect(mockShowToast).toHaveBeenCalledWith("Failed to apply MyResource", "error", { duration: 5000 });
    });

    it("should show custom error message when provided", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorMessage(k8sOperation.create, {
          customMessage: {
            message: "Custom error message",
            options: { duration: 10000 },
          },
        });
      });

      expect(mockShowToast).toHaveBeenCalledWith("Custom error message", "error", { duration: 10000 });
    });
  });

  describe("showRequestErrorDetailedMessage", () => {
    it("should show error message from Error object", () => {
      const { result } = renderHook(() => useRequestStatusMessages());
      const error = new Error("Something went wrong");

      act(() => {
        result.current.showRequestErrorDetailedMessage(error);
      });

      expect(mockShowToast).toHaveBeenCalledWith("Error: Something went wrong", "error", { duration: 5000 });
    });

    it("should show error message from string", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorDetailedMessage("String error");
      });

      expect(mockShowToast).toHaveBeenCalledWith("String error", "error", { duration: 5000 });
    });

    it("should show default message when error is null", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorDetailedMessage(null);
      });

      expect(mockShowToast).toHaveBeenCalledWith("An error occurred", "error", { duration: 5000 });
    });

    it("should show default message when error is undefined", () => {
      const { result } = renderHook(() => useRequestStatusMessages());

      act(() => {
        result.current.showRequestErrorDetailedMessage(undefined);
      });

      expect(mockShowToast).toHaveBeenCalledWith("An error occurred", "error", { duration: 5000 });
    });

    it("should handle error object with toString method", () => {
      const { result } = renderHook(() => useRequestStatusMessages());
      const error = { toString: () => "Custom error string" };

      act(() => {
        result.current.showRequestErrorDetailedMessage(error);
      });

      expect(mockShowToast).toHaveBeenCalledWith("Custom error string", "error", { duration: 5000 });
    });
  });
});
