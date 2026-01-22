import { describe, it, expect, vi } from "vitest";
import { createResourceAction, getResourceProtection } from "./index";
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
      const item = mockItem("patch");
      const protection = getResourceProtection(item, k8sOperation.patch);

      expect(protection.isProtected).toBe(true);
      expect(protection.reason).toBe("This resource is protected from updates.");

      const action = createResourceAction({
        item,
        type: k8sOperation.patch,
        label: "Edit",
        disabled: { status: protection.isProtected, reason: protection.reason },
      });

      expect(action.disabled?.status).toBe(true);
      expect(action.disabled?.reason).toBe("This resource is protected from updates.");
    });

    it("should handle 'update' protection label (RBAC verb) and normalize to patch", () => {
      const item = mockItem("update");
      const protection = getResourceProtection(item, k8sOperation.patch);

      expect(protection.isProtected).toBe(true);
      expect(protection.reason).toBe("This resource is protected from updates.");

      const action = createResourceAction({
        item,
        type: k8sOperation.patch,
        label: "Edit",
        disabled: { status: protection.isProtected, reason: protection.reason },
      });

      expect(action.disabled?.status).toBe(true);
      expect(action.disabled?.reason).toBe("This resource is protected from updates.");
    });

    it("should handle combined 'update-delete' protection label", () => {
      const item = mockItem("update-delete");
      const patchProtection = getResourceProtection(item, k8sOperation.patch);
      const deleteProtection = getResourceProtection(item, k8sOperation.delete);

      const patchAction = createResourceAction({
        item,
        type: k8sOperation.patch,
        label: "Edit",
        disabled: { status: patchProtection.isProtected, reason: patchProtection.reason },
      });

      const deleteAction = createResourceAction({
        item,
        type: k8sOperation.delete,
        label: "Delete",
        disabled: { status: deleteProtection.isProtected, reason: deleteProtection.reason },
      });

      expect(patchAction.disabled?.status).toBe(true);
      expect(patchAction.disabled?.reason).toBe("This resource is protected from updates.");

      expect(deleteAction.disabled?.status).toBe(true);
      expect(deleteAction.disabled?.reason).toBe("This resource is protected from deletion.");
    });

    it("should handle combined 'patch-delete' protection label", () => {
      const item = mockItem("patch-delete");
      const patchProtection = getResourceProtection(item, k8sOperation.patch);
      const deleteProtection = getResourceProtection(item, k8sOperation.delete);

      const patchAction = createResourceAction({
        item,
        type: k8sOperation.patch,
        label: "Edit",
        disabled: { status: patchProtection.isProtected, reason: patchProtection.reason },
      });

      const deleteAction = createResourceAction({
        item,
        type: k8sOperation.delete,
        label: "Delete",
        disabled: { status: deleteProtection.isProtected, reason: deleteProtection.reason },
      });

      expect(patchAction.disabled?.status).toBe(true);
      expect(patchAction.disabled?.reason).toBe("This resource is protected from updates.");

      expect(deleteAction.disabled?.status).toBe(true);
      expect(deleteAction.disabled?.reason).toBe("This resource is protected from deletion.");
    });

    it("should handle 'delete' protection label only", () => {
      const item = mockItem("delete");
      const patchProtection = getResourceProtection(item, k8sOperation.patch);
      const deleteProtection = getResourceProtection(item, k8sOperation.delete);

      // Patch should not be protected when only delete is protected
      expect(patchProtection.isProtected).toBe(false);
      expect(deleteProtection.isProtected).toBe(true);

      const patchAction = createResourceAction({
        item,
        type: k8sOperation.patch,
        label: "Edit",
        disabled: {
          status: patchProtection.isProtected,
          reason: "Custom reason",
        },
      });

      const deleteAction = createResourceAction({
        item,
        type: k8sOperation.delete,
        label: "Delete",
        disabled: { status: deleteProtection.isProtected, reason: deleteProtection.reason },
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
