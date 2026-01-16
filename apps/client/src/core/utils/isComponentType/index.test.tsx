import { describe, expect, test } from "vitest";
import * as React from "react";
import { isComponentType } from "./index";

describe("isComponentType", () => {
  test("returns true for function components", () => {
    const Component = () => <div>Test</div>;
    expect(isComponentType(Component)).toBe(true);
  });

  test("returns true for function components with props", () => {
    const Component = ({ name }: { name: string }) => <div>{name}</div>;
    expect(isComponentType(Component)).toBe(true);
  });

  test("returns true for forwardRef components", () => {
    const Component = React.forwardRef<HTMLDivElement>((_props, ref) => <div ref={ref}>Test</div>);
    expect(isComponentType(Component)).toBe(true);
  });

  test("returns false for valid React elements", () => {
    const element = <div>Test</div>;
    expect(isComponentType(element)).toBe(false);
  });

  test("returns false for strings", () => {
    expect(isComponentType("string")).toBe(false);
  });

  test("returns false for numbers", () => {
    expect(isComponentType(123)).toBe(false);
  });

  test("returns false for booleans", () => {
    expect(isComponentType(true)).toBe(false);
    expect(isComponentType(false)).toBe(false);
  });

  test("returns false for null", () => {
    expect(isComponentType(null)).toBe(false);
  });

  test("returns false for arrays", () => {
    expect(isComponentType([1, 2, 3])).toBe(false);
    expect(isComponentType([<div key="1">Test</div>])).toBe(false);
  });

  test("returns false for plain objects", () => {
    expect(isComponentType({})).toBe(false);
    expect(isComponentType({ foo: "bar" })).toBe(false);
  });

  test("returns true for component-like objects (forwardRef pattern)", () => {
    const mockForwardRef = {
      render: () => <div>Test</div>,
      $$typeof: Symbol.for("react.forward_ref"),
    };
    // This should return true based on the implementation logic
    expect(isComponentType(mockForwardRef)).toBe(true);
  });
});
