import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { downloadTextFile, ensureLogExtension, generateTimestampedLogFilename } from "./index";

describe("downloadTextFile", () => {
  beforeEach(() => {
    vi.spyOn(document, "createElement");
    vi.spyOn(URL, "createObjectURL");
    vi.spyOn(URL, "revokeObjectURL");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("creates and clicks anchor element with correct attributes", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    const mockUrl = "blob:http://localhost/test";

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue(mockUrl);

    downloadTextFile("test content", "test.txt");

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(mockAnchor.href).toBe(mockUrl);
    expect(mockAnchor.download).toBe("test.txt");
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });

  test("uses default mime type when not provided", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor);
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    downloadTextFile("content", "file.txt");

    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "text/plain" }));
  });

  test("uses custom mime type when provided", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor);
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    downloadTextFile("content", "file.json", "application/json");

    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "application/json" }));
  });
});

describe("ensureLogExtension", () => {
  test("returns filename with .log extension if no extension", () => {
    expect(ensureLogExtension("myfile")).toBe("myfile.log");
  });

  test("returns filename as-is if already has .log extension", () => {
    expect(ensureLogExtension("myfile.log")).toBe("myfile.log");
  });

  test("returns filename as-is if already has .txt extension", () => {
    expect(ensureLogExtension("myfile.txt")).toBe("myfile.txt");
  });

  test("handles filename with path", () => {
    expect(ensureLogExtension("path/to/myfile")).toBe("path/to/myfile.log");
  });
});

describe("generateTimestampedLogFilename", () => {
  test("generates filename with prefix and timestamp", () => {
    const filename = generateTimestampedLogFilename("pod-logs");
    expect(filename).toMatch(/^pod-logs-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.log$/);
  });

  test("replaces colons and dots in timestamp", () => {
    const filename = generateTimestampedLogFilename("tekton-logs");
    expect(filename).toContain("tekton-logs-");
    expect(filename).not.toContain(":");
    expect(filename).not.toContain(".");
    expect(filename).toMatch(/\.log$/);
  });

  test("uses different prefixes correctly", () => {
    const podLogs = generateTimestampedLogFilename("pod-logs");
    const tektonLogs = generateTimestampedLogFilename("tekton-logs");

    expect(podLogs).toContain("pod-logs-");
    expect(tektonLogs).toContain("tekton-logs-");
  });
});
