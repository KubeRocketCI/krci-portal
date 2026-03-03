import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitForElement } from "./waitForElement";

describe("waitForElement", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it("should resolve immediately when element already exists", async () => {
    const el = document.createElement("div");
    el.setAttribute("data-tour", "test-target");
    container.appendChild(el);

    const result = await waitForElement({
      selector: '[data-tour="test-target"]',
      context: container,
    });

    expect(result).toBe(el);
  });

  it("should resolve when element appears after delay via MutationObserver", async () => {
    const promise = waitForElement({
      selector: '[data-tour="delayed-target"]',
      timeout: 3000,
      context: container,
    });

    // Add the element after a small delay
    setTimeout(() => {
      const el = document.createElement("div");
      el.setAttribute("data-tour", "delayed-target");
      container.appendChild(el);
    }, 50);

    const result = await promise;
    expect(result.getAttribute("data-tour")).toBe("delayed-target");
  });

  it("should reject when element is not found within timeout", async () => {
    await expect(
      waitForElement({
        selector: '[data-tour="nonexistent"]',
        timeout: 100,
        context: container,
      })
    ).rejects.toThrow('Element with selector "[data-tour="nonexistent"]" not found within 100ms');
  });

  it("should disconnect observer on timeout", async () => {
    const disconnectSpy = vi.fn();
    const originalMutationObserver = global.MutationObserver;

    global.MutationObserver = class MockMutationObserver {
      observe() {}
      disconnect() {
        disconnectSpy();
      }
      takeRecords() {
        return [];
      }
    } as unknown as typeof MutationObserver;

    try {
      await waitForElement({
        selector: '[data-tour="missing"]',
        timeout: 50,
        context: container,
      }).catch(() => {});

      expect(disconnectSpy).toHaveBeenCalled();
    } finally {
      global.MutationObserver = originalMutationObserver;
    }
  });

  it("should search within custom context element", async () => {
    const customContext = document.createElement("section");
    document.body.appendChild(customContext);

    const el = document.createElement("span");
    el.setAttribute("data-tour", "scoped");
    customContext.appendChild(el);

    const result = await waitForElement({
      selector: '[data-tour="scoped"]',
      context: customContext,
    });

    expect(result).toBe(el);
    customContext.remove();
  });

  it("should detect element when data-tour attribute is added to existing element", async () => {
    const el = document.createElement("div");
    container.appendChild(el);

    const promise = waitForElement({
      selector: '[data-tour="attr-added"]',
      timeout: 3000,
      context: container,
    });

    // Set the attribute after a delay (tests attributes: true in observer config)
    setTimeout(() => {
      el.setAttribute("data-tour", "attr-added");
    }, 50);

    const result = await promise;
    expect(result).toBe(el);
  });
});
