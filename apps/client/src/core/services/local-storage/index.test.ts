import { describe, expect, test, beforeEach, vi } from "vitest";
import { LOCAL_STORAGE_SERVICE } from "./index";

describe("LOCAL_STORAGE_SERVICE", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getItem", () => {
    test("returns parsed JSON value for valid stored item", () => {
      const testData = { name: "test", value: 123 };
      localStorage.setItem("test-key", JSON.stringify(testData));

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toEqual(testData);
    });

    test("returns null for non-existent key", () => {
      const result = LOCAL_STORAGE_SERVICE.getItem("non-existent");

      expect(result).toBeNull();
    });

    test("returns null for undefined string value", () => {
      localStorage.setItem("test-key", "undefined");

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toBeNull();
    });

    test("returns null for invalid JSON", () => {
      localStorage.setItem("test-key", "invalid-json");

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toBeNull();
    });

    test("handles null values correctly", () => {
      localStorage.setItem("test-key", JSON.stringify(null));

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toBeNull();
    });

    test("handles boolean values", () => {
      localStorage.setItem("test-key", JSON.stringify(true));

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toBe(true);
    });

    test("handles number values", () => {
      localStorage.setItem("test-key", JSON.stringify(42));

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toBe(42);
    });

    test("handles string values", () => {
      localStorage.setItem("test-key", JSON.stringify("hello"));

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toBe("hello");
    });

    test("handles array values", () => {
      const testArray = [1, 2, 3, "test"];
      localStorage.setItem("test-key", JSON.stringify(testArray));

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toEqual(testArray);
    });

    test("handles complex nested objects", () => {
      const complexData = {
        user: {
          name: "John",
          settings: {
            theme: "dark",
            notifications: true,
          },
        },
        items: [1, 2, 3],
      };
      localStorage.setItem("test-key", JSON.stringify(complexData));

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");

      expect(result).toEqual(complexData);
    });
  });

  describe("setItem", () => {
    test("stores object as JSON string", () => {
      const testData = { name: "test", value: 123 };

      LOCAL_STORAGE_SERVICE.setItem("test-key", testData);

      const stored = localStorage.getItem("test-key");
      expect(stored).toBe(JSON.stringify(testData));
      expect(JSON.parse(stored!)).toEqual(testData);
    });

    test("stores string values", () => {
      LOCAL_STORAGE_SERVICE.setItem("test-key", "hello");

      const stored = localStorage.getItem("test-key");
      expect(JSON.parse(stored!)).toBe("hello");
    });

    test("stores number values", () => {
      LOCAL_STORAGE_SERVICE.setItem("test-key", 42);

      const stored = localStorage.getItem("test-key");
      expect(JSON.parse(stored!)).toBe(42);
    });

    test("stores boolean values", () => {
      LOCAL_STORAGE_SERVICE.setItem("test-key", true);

      const stored = localStorage.getItem("test-key");
      expect(JSON.parse(stored!)).toBe(true);
    });

    test("stores null values", () => {
      LOCAL_STORAGE_SERVICE.setItem("test-key", null);

      const stored = localStorage.getItem("test-key");
      expect(JSON.parse(stored!)).toBeNull();
    });

    test("stores array values", () => {
      const testArray = [1, 2, 3, "test"];

      LOCAL_STORAGE_SERVICE.setItem("test-key", testArray);

      const stored = localStorage.getItem("test-key");
      expect(JSON.parse(stored!)).toEqual(testArray);
    });

    test("overwrites existing values", () => {
      LOCAL_STORAGE_SERVICE.setItem("test-key", "old-value");
      LOCAL_STORAGE_SERVICE.setItem("test-key", "new-value");

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");
      expect(result).toBe("new-value");
    });
  });

  describe("removeItem", () => {
    test("removes existing item", () => {
      localStorage.setItem("test-key", "value");

      LOCAL_STORAGE_SERVICE.removeItem("test-key");

      const result = localStorage.getItem("test-key");
      expect(result).toBeNull();
    });

    test("handles removing non-existent item", () => {
      // Should not throw
      expect(() => {
        LOCAL_STORAGE_SERVICE.removeItem("non-existent");
      }).not.toThrow();
    });

    test("removes item completely", () => {
      LOCAL_STORAGE_SERVICE.setItem("test-key", { data: "value" });
      LOCAL_STORAGE_SERVICE.removeItem("test-key");

      const result = LOCAL_STORAGE_SERVICE.getItem("test-key");
      expect(result).toBeNull();
    });
  });

  describe("integration tests", () => {
    test("full cycle: set, get, remove", () => {
      const testData = { user: "john", age: 30 };

      // Set
      LOCAL_STORAGE_SERVICE.setItem("user-data", testData);
      expect(LOCAL_STORAGE_SERVICE.getItem("user-data")).toEqual(testData);

      // Get
      const retrieved = LOCAL_STORAGE_SERVICE.getItem("user-data");
      expect(retrieved).toEqual(testData);

      // Remove
      LOCAL_STORAGE_SERVICE.removeItem("user-data");
      expect(LOCAL_STORAGE_SERVICE.getItem("user-data")).toBeNull();
    });

    test("handles multiple keys independently", () => {
      LOCAL_STORAGE_SERVICE.setItem("key1", "value1");
      LOCAL_STORAGE_SERVICE.setItem("key2", "value2");
      LOCAL_STORAGE_SERVICE.setItem("key3", "value3");

      expect(LOCAL_STORAGE_SERVICE.getItem("key1")).toBe("value1");
      expect(LOCAL_STORAGE_SERVICE.getItem("key2")).toBe("value2");
      expect(LOCAL_STORAGE_SERVICE.getItem("key3")).toBe("value3");

      LOCAL_STORAGE_SERVICE.removeItem("key2");

      expect(LOCAL_STORAGE_SERVICE.getItem("key1")).toBe("value1");
      expect(LOCAL_STORAGE_SERVICE.getItem("key2")).toBeNull();
      expect(LOCAL_STORAGE_SERVICE.getItem("key3")).toBe("value3");
    });
  });
});
