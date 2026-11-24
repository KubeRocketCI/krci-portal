import { vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { findRadixDialogWarnings } from "./radixWarnings";

let warnSpy: ReturnType<typeof vi.spyOn> | undefined;
let errorSpy: ReturnType<typeof vi.spyOn> | undefined;

// A dialog or sheet opened without a title or a description fails the test that opened it.
beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn");
  errorSpy = vi.spyOn(console, "error");
});

afterEach(() => {
  const warnings = findRadixDialogWarnings([...(warnSpy?.mock.calls ?? []), ...(errorSpy?.mock.calls ?? [])]);
  warnSpy?.mockRestore();
  errorSpy?.mockRestore();
  warnSpy = undefined;
  errorSpy = undefined;
  cleanup();
  if (warnings.length > 0) {
    throw new Error(`Dialog opened without a title or description:\n${warnings.join("\n")}`);
  }
});

// Mock localStorage globally for all tests with actual storage
const storage = new Map<string, string>();

const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
  get length() {
    return storage.size;
  },
  key: vi.fn((index: number) => {
    const keys = Array.from(storage.keys());
    return keys[index] ?? null;
  }),
};

global.localStorage = localStorageMock as unknown as Storage;

// Mock ResizeObserver
global.ResizeObserver = vi.fn(
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);

// Mock window.matchMedia (not implemented in jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock DOM APIs that Radix / cmdk rely on but jsdom does not implement.
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
