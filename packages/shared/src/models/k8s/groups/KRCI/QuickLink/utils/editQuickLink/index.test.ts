import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { editQuickLink } from "./index.js";

describe("K8sQuickLink: editQuickLink", () => {
  const mockQuickLink = {
    apiVersion: "v2.edp.epam.com/v1",
    kind: "QuickLink",
    metadata: {
      name: "test-quicklink",
      namespace: "default",
      creationTimestamp: "2023-01-01T00:00:00Z",
      uid: "test-uid-123",
    },
    spec: {
      type: "default",
      icon: "old-icon",
      url: "https://old-url.com",
      visible: false,
    },
  } as const;

  it("should return an updated QuickLink with new values", () => {
    const input = {
      url: "https://new-url.com",
      visible: true,
      icon: "new-icon",
    };

    const result = editQuickLink(mockQuickLink, input);

    expect(result).toEqual({
      ...mockQuickLink,
      spec: {
        ...mockQuickLink.spec,
        url: "https://new-url.com",
        visible: true,
        icon: "new-icon",
      },
    });
  });

  it("should preserve all non-editable fields", () => {
    const input = {
      url: "https://updated-url.com",
      visible: true,
      icon: "updated-icon",
    };

    const result = editQuickLink(mockQuickLink, input);

    // Check that metadata and other spec fields are preserved
    expect(result.metadata).toEqual(mockQuickLink.metadata);
    expect(result.apiVersion).toBe(mockQuickLink.apiVersion);
    expect(result.kind).toBe(mockQuickLink.kind);
    expect(result.spec.type).toBe(mockQuickLink.spec.type);
  });

  it("should correctly update only the url", () => {
    const input = {
      url: "https://only-url-changed.com",
      visible: mockQuickLink.spec.visible,
      icon: mockQuickLink.spec.icon,
    };

    const result = editQuickLink(mockQuickLink, input);

    expect(result.spec.url).toBe("https://only-url-changed.com");
    expect(result.spec.visible).toBe(mockQuickLink.spec.visible);
    expect(result.spec.icon).toBe(mockQuickLink.spec.icon);
  });

  it("should correctly update only the visible property", () => {
    const input = {
      url: mockQuickLink.spec.url,
      visible: true,
      icon: mockQuickLink.spec.icon,
    };

    const result = editQuickLink(mockQuickLink, input);

    expect(result.spec.url).toBe(mockQuickLink.spec.url);
    expect(result.spec.visible).toBe(true);
    expect(result.spec.icon).toBe(mockQuickLink.spec.icon);
  });

  it("should correctly update only the icon", () => {
    const input = {
      url: mockQuickLink.spec.url,
      visible: mockQuickLink.spec.visible,
      icon: "new-icon-only",
    };

    const result = editQuickLink(mockQuickLink, input);

    expect(result.spec.url).toBe(mockQuickLink.spec.url);
    expect(result.spec.visible).toBe(mockQuickLink.spec.visible);
    expect(result.spec.icon).toBe("new-icon-only");
  });

  it("should handle different URL formats", () => {
    const urls = [
      "https://example.com",
      "http://localhost:3000",
      "https://api.example.org/v1",
      "https://dashboard.example.com/path/to/resource",
    ];

    urls.forEach((url) => {
      const input = {
        url,
        visible: true,
        icon: "test-icon",
      };

      const result = editQuickLink(mockQuickLink, input);

      expect(result.spec.url).toBe(url);
    });
  });

  it("should handle different icon values", () => {
    const icons = ["dashboard", "link", "settings", "custom-icon", "star"];

    icons.forEach((icon) => {
      const input = {
        url: "https://example.com",
        visible: true,
        icon,
      };

      const result = editQuickLink(mockQuickLink, input);

      expect(result.spec.icon).toBe(icon);
    });
  });

  it("should handle visible property correctly", () => {
    const visibleResult = editQuickLink(mockQuickLink, {
      url: "https://example.com",
      visible: true,
      icon: "link",
    });

    const hiddenResult = editQuickLink(mockQuickLink, {
      url: "https://example.com",
      visible: false,
      icon: "link",
    });

    expect(visibleResult.spec.visible).toBe(true);
    expect(hiddenResult.spec.visible).toBe(false);
  });

  it("should validate the updated QuickLink against quickLinkSchema", () => {
    const input = {
      url: "https://valid-url.com",
      visible: true,
      icon: "valid-icon",
    };

    const result = editQuickLink(mockQuickLink, input);

    // The function should not throw and should return a valid QuickLink
    expect(result).toBeDefined();
    expect(result.apiVersion).toBe("v2.edp.epam.com/v1");
    expect(result.kind).toBe("QuickLink");
    expect(result.spec.type).toBe("default");
  });

  it("should allow empty url", () => {
    const result = editQuickLink(mockQuickLink, {
      url: "",
      visible: true,
      icon: "link",
    });
    expect(result.spec.url).toBe("");
  });

  it("should allow empty icon", () => {
    const result = editQuickLink(mockQuickLink, {
      url: "https://example.com",
      visible: true,
      icon: "",
    });
    expect(result.spec.icon).toBe("");
  });

  it("should throw a ZodError if the input is invalid - missing required fields", () => {
    expect(() =>
      editQuickLink(mockQuickLink, {
        url: "https://example.com",
        visible: true,
        // missing icon field
      } as any)
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the input is invalid - wrong visible type", () => {
    expect(() =>
      editQuickLink(mockQuickLink, {
        url: "https://example.com",
        visible: "true", // should be boolean, not string
        icon: "link",
      } as any)
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the input is invalid - wrong url type", () => {
    expect(() =>
      editQuickLink(mockQuickLink, {
        url: 123, // should be string, not number
        visible: true,
        icon: "link",
      } as any)
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the input is invalid - wrong icon type", () => {
    expect(() =>
      editQuickLink(mockQuickLink, {
        url: "https://example.com",
        visible: true,
        icon: 456, // should be string, not number
      } as any)
    ).toThrow(ZodError);
  });

  it("should work with different QuickLink structures", () => {
    const differentQuickLink = {
      apiVersion: "v2.edp.epam.com/v1",
      kind: "QuickLink",
      metadata: {
        name: "different-quicklink",
        namespace: "custom-namespace",
        creationTimestamp: "2023-01-01T00:00:00Z",
        uid: "different-uid-456",
      },
      spec: {
        type: "system" as const,
        icon: "different-icon",
        url: "https://different-url.com",
        visible: true,
      },
    };

    const input = {
      url: "https://updated-url.com",
      visible: false,
      icon: "updated-icon",
    };

    const result = editQuickLink(differentQuickLink, input);

    expect(result.spec.url).toBe("https://updated-url.com");
    expect(result.spec.visible).toBe(false);
    expect(result.spec.icon).toBe("updated-icon");
    expect(result.spec.type).toBe("system"); // Preserved
    expect(result.metadata).toEqual(differentQuickLink.metadata); // Preserved
  });
});
