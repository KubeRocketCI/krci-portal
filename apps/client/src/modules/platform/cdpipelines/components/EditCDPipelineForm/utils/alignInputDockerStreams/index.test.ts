import { describe, expect, it } from "vitest";
import { alignInputDockerStreams } from "./index";

describe("alignInputDockerStreams", () => {
  it("should trim streams when longer than applications length", () => {
    const result = alignInputDockerStreams(["stream1", "stream2", "stream3"], 2);

    expect(result).toEqual(["stream1", "stream2"]);
  });

  it("should pad with empty strings when streams are shorter than applications length", () => {
    const result = alignInputDockerStreams(["stream1"], 3);

    expect(result).toEqual(["stream1", "", ""]);
  });

  it("should return streams unchanged when same length as applications", () => {
    const result = alignInputDockerStreams(["stream1", "stream2"], 2);

    expect(result).toEqual(["stream1", "stream2"]);
  });

  it("should return array of empty strings when streams is undefined", () => {
    const result = alignInputDockerStreams(undefined, 3);

    expect(result).toEqual(["", "", ""]);
  });

  it("should return empty array when applications length is 0", () => {
    const result = alignInputDockerStreams(["stream1", "stream2"], 0);

    expect(result).toEqual([]);
  });
});
