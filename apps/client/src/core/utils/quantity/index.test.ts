import { describe, expect, it } from "vitest";
import { formatCores, formatMemory, parseCpuToCores, parseMemoryToBytes } from "./index";

describe("parseCpuToCores", () => {
  it.each([
    ["2", 2],
    ["100m", 0.1],
    ["500u", 0.0005],
    ["250000000n", 0.25],
    [1.5, 1.5],
    ["", 0],
    [undefined, 0],
  ])("parses %s", (value, cores) => {
    expect(parseCpuToCores(value)).toBeCloseTo(cores);
  });
});

describe("parseMemoryToBytes", () => {
  it.each([
    ["1Ki", 1024],
    ["2Gi", 2 * 1024 ** 3],
    ["1k", 1e3],
    ["1K", 1e3],
    ["3M", 3e6],
    ["512", 512],
    ["", 0],
    [undefined, 0],
  ])("parses %s", (value, bytes) => {
    expect(parseMemoryToBytes(value)).toBe(bytes);
  });
});

describe("formatCores", () => {
  it.each([
    [0, "0"],
    [-1, "0"],
    [Number.NaN, "0"],
    [0.25, "0.25"],
    [1, "1.0"],
    [12.4, "12"],
  ])("formats %s", (cores, text) => {
    expect(formatCores(cores)).toBe(text);
  });
});

describe("formatMemory", () => {
  it.each([
    [0, "0 Mi"],
    [Number.NaN, "0 Mi"],
    [512 * 1024 ** 2, "512 Mi"],
    [2 * 1024 ** 3, "2.0 Gi"],
  ])("formats %s", (bytes, text) => {
    expect(formatMemory(bytes)).toBe(text);
  });
});
