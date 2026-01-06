import { describe, it, expect } from "vitest";
import { createImageStreamTags } from "./index";
import { CodebaseImageStream } from "@my-project/shared";

describe("createImageStreamTags", () => {
  const createMockImageStream = (tags: string[]): CodebaseImageStream => ({
    apiVersion: "v2.krci.io/v1",
    kind: "CodebaseImageStream",
    metadata: {
      name: "test-stream",
      namespace: "default",
      uid: "test-uid",
      resourceVersion: "1",
      creationTimestamp: "2023-01-01T00:00:00Z",
    },
    spec: {
      codebase: "test-codebase",
      imageName: "test-image",
      tags: tags.map(name => ({
        name,
        created: "2023-07-31T14:32:28Z",
      })),
    },
    status: {
      failureCount: 0,
    },
  });

  it("should create tags with both STABLE and LATEST when both streams have tags", () => {
    const appStream = createMockImageStream([
      "main-0.1.0-20230731-094439",
      "main-0.1.0-20230731-133849",
      "main-0.1.0-20230731-134738",
      "main-0.1.0-20230731-143228",
    ]);

    const verifiedStream = createMockImageStream([
      "main-0.1.0-20230731-143228",
    ]);

    const result = createImageStreamTags(appStream, verifiedStream);

    expect(result).toEqual([
      {
        label: "[STABLE] - main-0.1.0-20230731-143228",
        value: "stable::main-0.1.0-20230731-143228",
      },
      {
        label: "[LATEST] - main-0.1.0-20230731-143228",
        value: "latest::main-0.1.0-20230731-143228",
      },
      {
        label: "main-0.1.0-20230731-143228",
        value: "main-0.1.0-20230731-143228",
      },
      {
        label: "main-0.1.0-20230731-134738",
        value: "main-0.1.0-20230731-134738",
      },
      {
        label: "main-0.1.0-20230731-133849",
        value: "main-0.1.0-20230731-133849",
      },
      {
        label: "main-0.1.0-20230731-094439",
        value: "main-0.1.0-20230731-094439",
      },
    ]);
  });

  it("should create tags with only LATEST when verified stream has no tags", () => {
    const appStream = createMockImageStream(["tag-1", "tag-2"]);
    const verifiedStream = createMockImageStream([]);

    const result = createImageStreamTags(appStream, verifiedStream);

    expect(result).toEqual([
      {
        label: "[LATEST] - tag-2",
        value: "latest::tag-2",
      },
      {
        label: "tag-2",
        value: "tag-2",
      },
      {
        label: "tag-1",
        value: "tag-1",
      },
    ]);
  });

  it("should handle empty application stream tags", () => {
    const appStream = createMockImageStream([]);
    const verifiedStream = createMockImageStream([]);

    const result = createImageStreamTags(appStream, verifiedStream);

    expect(result).toEqual([]);
  });

  it("should reverse tag order (newest first)", () => {
    const appStream = createMockImageStream(["old-tag", "middle-tag", "new-tag"]);
    const verifiedStream = createMockImageStream([]);

    const result = createImageStreamTags(appStream, verifiedStream);

    // First should be LATEST with newest tag
    expect(result[0]).toEqual({
      label: "[LATEST] - new-tag",
      value: "latest::new-tag",
    });

    // Then reversed order
    expect(result[1].value).toBe("new-tag");
    expect(result[2].value).toBe("middle-tag");
    expect(result[3].value).toBe("old-tag");
  });
});
