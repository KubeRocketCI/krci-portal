import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { FieldApi } from "@tanstack/react-form";
import { SwitchField } from "./index";

// Helper function to create a mock field
//@ts-expect-error TEMPORARY
const createMockField = (overrides = {}): FieldApi<Record<string, unknown>, string> => {
  return {
    name: "testSwitch",
    state: {
      value: false,
      meta: {
        errors: [],
      },
    },
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    //@ts-expect-error TEMPORARY
    form: {} as unknown as FormApi<Record<string, unknown>>,
    ...overrides,
  } as unknown as FieldApi<
    Record<string, unknown>,
    string,
    unknown,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  >;
};

describe("SwitchField", () => {
  test("renders switch with correct initial state (unchecked)", () => {
    const field = createMockField();
    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).not.toBeChecked();
  });

  test("renders switch as checked when value is true", () => {
    const field = createMockField({
      state: { value: true, meta: { errors: [] } },
    });
    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeChecked();
  });

  test("renders switch as unchecked when value is false", () => {
    const field = createMockField({
      state: { value: false, meta: { errors: [] } },
    });
    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).not.toBeChecked();
  });

  test("handles null/undefined value as unchecked", () => {
    const field = createMockField({
      state: { value: null, meta: { errors: [] } },
    });
    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).not.toBeChecked();
  });

  test("calls handleChange when switch is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const field = createMockField({ handleChange });

    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    await user.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  test("calls handleChange with false when checked switch is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const field = createMockField({
      state: { value: true, meta: { errors: [] } },
      handleChange,
    });

    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    await user.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  test("calls handleBlur when switch loses focus", async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    const field = createMockField({ handleBlur });

    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    await user.click(switchElement);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  test("renders disabled switch when disabled prop is true", () => {
    const field = createMockField();
    render(<SwitchField field={field} disabled={true} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDisabled();
  });

  test("renders enabled switch when disabled prop is false", () => {
    const field = createMockField();
    render(<SwitchField field={field} disabled={false} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).not.toBeDisabled();
  });

  test("disabled switch cannot be toggled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const field = createMockField({ handleChange });

    render(<SwitchField field={field} disabled={true} />);

    const switchElement = screen.getByRole("switch");
    await user.click(switchElement);

    expect(handleChange).not.toHaveBeenCalled();
  });

  test("marks switch as invalid when field has errors", () => {
    const field = createMockField({
      state: {
        value: false,
        meta: {
          errors: ["This field is required"],
        },
      },
    });

    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("aria-invalid", "true");
  });

  test("marks switch as valid when field has no errors", () => {
    const field = createMockField();
    render(<SwitchField field={field} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("aria-invalid", "false");
  });
});
