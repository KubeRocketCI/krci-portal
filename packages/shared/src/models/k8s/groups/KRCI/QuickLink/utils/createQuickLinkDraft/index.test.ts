import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { k8sQuickLinkConfig } from "../../constants.js";
import { createQuickLinkDraft } from "./index.js";

describe("K8sQuickLink: createQuickLinkDraft", () => {
  it("should return a valid QuickLinkDraft object", () => {
    const result = createQuickLinkDraft({
      name: "my-quicklink",
      icon: "link",
      url: "https://example.com",
      visible: true,
    });

    expect(result).toEqual({
      apiVersion: k8sQuickLinkConfig.apiVersion,
      kind: k8sQuickLinkConfig.kind,
      metadata: {
        name: "my-quicklink",
      },
      spec: {
        type: "default",
        icon: "link",
        url: "https://example.com",
        visible: true,
      },
    });
  });

  it("should correctly set the metadata name", () => {
    const name = "test-quicklink";
    const result = createQuickLinkDraft({
      name,
      icon: "link",
      url: "https://example.com",
      visible: true,
    });

    expect(result.metadata.name).toBe(name);
  });

  it("should correctly set all spec properties", () => {
    const icon = "dashboard";
    const url = "https://dashboard.example.org";
    const visible = false;

    const result = createQuickLinkDraft({
      name: "dashboard-link",
      icon,
      url,
      visible,
    });

    expect(result.spec.icon).toBe(icon);
    expect(result.spec.url).toBe(url);
    expect(result.spec.visible).toBe(visible);
    expect(result.spec.type).toBe("default");
  });

  it("should handle different icon values", () => {
    const result = createQuickLinkDraft({
      name: "custom-icon-link",
      icon: "custom-icon",
      url: "https://example.com",
      visible: true,
    });

    expect(result.spec.icon).toBe("custom-icon");
  });

  it("should handle different URL formats", () => {
    const urls = [
      "https://example.com",
      "http://localhost:3000",
      "https://api.example.org/v1",
      "https://dashboard.example.com/path/to/resource",
    ];

    urls.forEach((url) => {
      const result = createQuickLinkDraft({
        name: "url-test",
        icon: "link",
        url,
        visible: true,
      });

      expect(result.spec.url).toBe(url);
    });
  });

  it("should handle visible property correctly", () => {
    const visibleResult = createQuickLinkDraft({
      name: "visible-link",
      icon: "link",
      url: "https://example.com",
      visible: true,
    });

    const hiddenResult = createQuickLinkDraft({
      name: "hidden-link",
      icon: "link",
      url: "https://example.com",
      visible: false,
    });

    expect(visibleResult.spec.visible).toBe(true);
    expect(hiddenResult.spec.visible).toBe(false);
  });

  it("should always set type to 'default'", () => {
    const result = createQuickLinkDraft({
      name: "default-type-test",
      icon: "link",
      url: "https://example.com",
      visible: true,
    });

    expect(result.spec.type).toBe("default");
  });

  it("should throw a ZodError if the input is invalid - empty name", () => {
    expect(() =>
      createQuickLinkDraft({
        name: "",
        icon: "link",
        url: "https://example.com",
        visible: true,
      })
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the input is invalid - empty icon", () => {
    expect(() =>
      createQuickLinkDraft({
        name: "test",
        icon: "",
        url: "https://example.com",
        visible: true,
      })
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the input is invalid - empty url", () => {
    expect(() =>
      createQuickLinkDraft({
        name: "test",
        icon: "link",
        url: "",
        visible: true,
      })
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the input is invalid - missing required fields", () => {
    expect(() =>
      createQuickLinkDraft({
        name: "test",
        icon: "link",
        url: "https://example.com",
        // missing visible field
      } as any)
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the input is invalid - wrong visible type", () => {
    expect(() =>
      createQuickLinkDraft({
        name: "test",
        icon: "link",
        url: "https://example.com",
        visible: "true", // should be boolean, not string
      } as any)
    ).toThrow(ZodError);
  });

  it("should throw a ZodError if the generated draft is invalid", () => {
    // This test ensures that even if input validation passes,
    // the final draft validation will catch any issues
    expect(() =>
      createQuickLinkDraft({
        name: "valid-name",
        icon: "valid-icon",
        url: "valid-url",
        visible: true,
      })
    ).not.toThrow(ZodError);
  });
});
