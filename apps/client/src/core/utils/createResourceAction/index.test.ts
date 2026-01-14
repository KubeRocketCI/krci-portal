import { describe, it, expect, vi } from "vitest";
import { createResourceAction } from "./index";
import { k8sOperation, krciCommonLabels } from "@my-project/shared";

describe("createResourceAction", () => {
  describe("protection label normalization", () => {
    const mockItem = (protectionLabel?: string) =>
      ({
        apiVersion: "v1",
        kind: "Test",
        metadata: {
          name: "test-resource",
          namespace: "default",
          uid: "test-uid",
          creationTimestamp: "2024-01-01T00:00:00Z",
          labels: protectionLabel
            ? {
                [krciCommonLabels.editProtection]: protectionLabel,
              }
            : {},
        },
        spec: {},
      }) as const;

    it("should handle 'patch' protection label (K8s operation)", () => {
      const action = createResourceAction({
        item: mockItem("patch"),
        type: k8sOperation.patch,
        label: "Edit",
      });

      expect(action.disabled?.status).toBe(true);
      expect(action.disabled?.reason).toBe("This resource is protected from updates.");
    });

    it("should handle 'update' protection label (RBAC verb) and normalize to patch", () => {
      const action = createResourceAction({
        item: mockItem("update"),
        type: k8sOperation.patch,
        label: "Edit",
      });

      expect(action.disabled?.status).toBe(true);
      expect(action.disabled?.reason).toBe("This resource is protected from updates.");
    });

    it("should handle combined 'update-delete' protection label", () => {
      const patchAction = createResourceAction({
        item: mockItem("update-delete"),
        type: k8sOperation.patch,
        label: "Edit",
      });

      const deleteAction = createResourceAction({
        item: mockItem("update-delete"),
        type: k8sOperation.delete,
        label: "Delete",
      });

      expect(patchAction.disabled?.status).toBe(true);
      expect(patchAction.disabled?.reason).toBe("This resource is protected from updates.");

      expect(deleteAction.disabled?.status).toBe(true);
      expect(deleteAction.disabled?.reason).toBe("This resource is protected from deletion.");
    });

    it("should handle combined 'patch-delete' protection label", () => {
      const patchAction = createResourceAction({
        item: mockItem("patch-delete"),
        type: k8sOperation.patch,
        label: "Edit",
      });

      const deleteAction = createResourceAction({
        item: mockItem("patch-delete"),
        type: k8sOperation.delete,
        label: "Delete",
      });

      expect(patchAction.disabled?.status).toBe(true);
      expect(patchAction.disabled?.reason).toBe("This resource is protected from updates.");

      expect(deleteAction.disabled?.status).toBe(true);
      expect(deleteAction.disabled?.reason).toBe("This resource is protected from deletion.");
    });

    it("should handle 'delete' protection label only", () => {
      const patchAction = createResourceAction({
        item: mockItem("delete"),
        type: k8sOperation.patch,
        label: "Edit",
        disabled: {
          status: false,
          reason: "Custom reason",
        },
      });

      const deleteAction = createResourceAction({
        item: mockItem("delete"),
        type: k8sOperation.delete,
        label: "Delete",
      });

      // Patch should not be disabled when only delete is protected
      expect(patchAction.disabled?.status).toBe(false);

      // Delete should be disabled
      expect(deleteAction.disabled?.status).toBe(true);
      expect(deleteAction.disabled?.reason).toBe("This resource is protected from deletion.");
    });

    it("should not be disabled when no protection label exists", () => {
      const action = createResourceAction({
        item: mockItem(),
        type: k8sOperation.patch,
        label: "Edit",
        disabled: {
          status: false,
          reason: "Custom reason",
        },
      });

      expect(action.disabled?.status).toBe(false);
      expect(action.disabled?.reason).toBeUndefined();
    });

    it("should use custom disabled state when no protection label exists", () => {
      const action = createResourceAction({
        item: mockItem(),
        type: k8sOperation.patch,
        label: "Edit",
        disabled: {
          status: true,
          reason: "Custom reason",
        },
      });

      expect(action.disabled?.status).toBe(true);
      expect(action.disabled?.reason).toBe("Custom reason");
    });

    it("should create action with correct properties", () => {
      const mockCallback = vi.fn();
      const mockIcon = "test-icon";

      const action = createResourceAction({
        item: mockItem(),
        type: k8sOperation.patch,
        label: "Edit",
        callback: mockCallback,
        Icon: mockIcon,
        isTextButton: true,
      });

      expect(action.name).toBe(k8sOperation.patch);
      expect(action.label).toBe("Edit");
      expect(action.Icon).toBe(mockIcon);
      expect(action.isTextButton).toBe(true);
      expect(action.action).toBeDefined();

      // Test callback execution
      const mockEvent = {
        stopPropagation: vi.fn(),
      };

      action.action(mockEvent as unknown as React.MouseEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(mockItem());
    });
  });
});
