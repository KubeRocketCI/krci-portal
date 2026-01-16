import { describe, expect, test } from "vitest";
import * as React from "react";
import { toElement } from "./index";

describe("toElement", () => {
  test("returns valid React element as-is with extra props merged", () => {
    const element = <div className="original">Test</div>;
    const result = toElement(element, { id: "test-id" }) as React.ReactElement<{ className: string; id: string }>;

    expect(React.isValidElement(result)).toBe(true);
    expect(result?.props?.className).toBe("original");
    expect(result?.props?.id).toBe("test-id");
  });

  test("creates element from function component", () => {
    const Component = ({ name, id }: { name?: string; id?: string }) => <div id={id}>{name}</div>;
    const result = toElement(Component, { name: "Test", id: "component-id" }) as React.ReactElement<{
      name: string;
      id: string;
    }>;

    expect(React.isValidElement(result)).toBe(true);
    expect(result.type).toBe(Component);
    expect(result.props.name).toBe("Test");
    expect(result.props.id).toBe("component-id");
  });

  test("creates element from forwardRef component", () => {
    const Component = React.forwardRef<HTMLDivElement, { name?: string }>((props, ref) => (
      <div ref={ref}>{props.name}</div>
    ));
    const result = toElement(Component, { name: "ForwardRef" }) as React.ReactElement<{ name: string }>;

    expect(React.isValidElement(result)).toBe(true);
    expect(result.type).toBe(Component);
    expect(result.props.name).toBe("ForwardRef");
  });

  test("returns string as-is", () => {
    expect(toElement("test string")).toBe("test string");
    expect(toElement("test string", { id: "ignored" })).toBe("test string");
  });

  test("returns number as-is", () => {
    expect(toElement(123)).toBe(123);
    expect(toElement(0)).toBe(0);
  });

  test("returns null as-is", () => {
    expect(toElement(null)).toBe(null);
  });

  test("handles empty extra props", () => {
    const Component = () => <div>Test</div>;
    const result = toElement(Component) as React.ReactElement<{ name: string }>;

    expect(React.isValidElement(result)).toBe(true);
    expect(result?.props).toEqual({});
  });

  test("merges props correctly for existing element", () => {
    const element = (
      <div className="original" data-test="original">
        Content
      </div>
    );
    const result = toElement(element, {
      className: "merged",
      id: "new-id",
    }) as React.ReactElement<{ className: string; "data-test": string; id: string }>;

    expect(result.props.className).toBe("merged");
    expect(result.props["data-test"]).toBe("original");
    expect(result.props.id).toBe("new-id");
  });
});
