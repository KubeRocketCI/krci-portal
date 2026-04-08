import { describe, expect, it, vi, beforeEach } from "vitest";
import { downloadTextFile, ensureLogExtension, generateTimestampedLogFilename, sanitizeLogFilenamePart } from "./index";

describe("downloadTextFile", () => {
  let mockClick: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClick = vi.fn();
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
    mockRevokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLAnchorElement);
  });

  it("should create a blob and trigger download", () => {
    downloadTextFile("file content", "test.txt");

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("should use default mime type text/plain", () => {
    downloadTextFile("content", "file.txt");

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/plain");
  });

  it("should use custom mime type when provided", () => {
    downloadTextFile("content", "file.json", "application/json");

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
  });
});

describe("ensureLogExtension", () => {
  it("should return filename unchanged if it ends with .log", () => {
    expect(ensureLogExtension("app.log")).toBe("app.log");
  });

  it("should return filename unchanged if it ends with .txt", () => {
    expect(ensureLogExtension("app.txt")).toBe("app.txt");
  });

  it("should add .log extension if missing", () => {
    expect(ensureLogExtension("app")).toBe("app.log");
  });

  it("should add .log extension for other extensions", () => {
    expect(ensureLogExtension("app.json")).toBe("app.json.log");
  });
});

describe("sanitizeLogFilenamePart", () => {
  it("should pass through alphanumeric characters unchanged", () => {
    expect(sanitizeLogFilenamePart("abc123")).toBe("abc123");
  });

  it("should pass through hyphens and underscores unchanged", () => {
    expect(sanitizeLogFilenamePart("my-pod_name")).toBe("my-pod_name");
  });

  it("should replace dots, slashes, and spaces with underscores", () => {
    expect(sanitizeLogFilenamePart("my.pod/name space")).toBe("my_pod_name_space");
  });

  it("should replace colons with underscores", () => {
    expect(sanitizeLogFilenamePart("step:init")).toBe("step_init");
  });

  it("should return empty string for empty input", () => {
    expect(sanitizeLogFilenamePart("")).toBe("");
  });
});

describe("generateTimestampedLogFilename", () => {
  it("should generate a filename with prefix and .log extension", () => {
    const result = generateTimestampedLogFilename("pod-logs");
    expect(result).toMatch(/^pod-logs-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d+Z\.log$/);
  });

  it("should use different prefixes", () => {
    const result = generateTimestampedLogFilename("tekton-logs");
    expect(result).toMatch(/^tekton-logs-/);
    expect(result).toMatch(/\.log$/);
  });
});
