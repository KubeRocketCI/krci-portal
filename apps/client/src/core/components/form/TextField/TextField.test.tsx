import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { FieldApi } from "@tanstack/react-form";
import { TextField } from "./index";

// Helper function to create a mock field
//@ts-expect-error TEMPORARY
const createMockField = (overrides = {}): FieldApi<Record<string, unknown>, string> => {
  return {
    name: "testField",
    state: {
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

describe("TextField", () => {
  test("renders with basic props", () => {
    const field = createMockField();
    render(<TextField field={field} label="Test Label" placeholder="Test Placeholder" />);

    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Test Placeholder")).toBeInTheDocument();
  });

  test("displays the field value", () => {
    const field = createMockField({
      state: { value: "Test Value", meta: { errors: [] } },
    });
    render(<TextField field={field} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Test Value");
  });

  test("handles empty value correctly", () => {
    const field = createMockField({
      state: { value: null, meta: { errors: [] } },
    });
    render(<TextField field={field} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  test("calls handleChange when user types", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const field = createMockField({ handleChange });

    render(<TextField field={field} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "Hello");

    expect(handleChange).toHaveBeenCalled();
  });

  test("calls handleBlur when input loses focus", async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    const field = createMockField({ handleBlur });

    render(<TextField field={field} />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  test("displays error message when field has errors", () => {
    const field = createMockField({
      state: {
        value: "",
        meta: {
          errors: ["This field is required"],
        },
      },
    });

    render(<TextField field={field} label="Test Field" />);

    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  test("marks input as invalid when field has errors", () => {
    const field = createMockField({
      state: {
        value: "",
        meta: {
          errors: ["This field is required"],
        },
      },
    });

    render(<TextField field={field} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("renders disabled input when disabled prop is true", () => {
    const field = createMockField();
    render(<TextField field={field} disabled={true} />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  test("renders enabled input when disabled prop is false", () => {
    const field = createMockField();
    render(<TextField field={field} disabled={false} />);

    const input = screen.getByRole("textbox");
    expect(input).not.toBeDisabled();
  });

  test("has proper aria-describedby when error exists", () => {
    const field = createMockField({
      state: {
        value: "",
        meta: {
          errors: ["Error message"],
        },
      },
    });

    render(<TextField field={field} />);

    const input = screen.getByRole("textbox");
    const ariaDescribedBy = input.getAttribute("aria-describedby");

    expect(ariaDescribedBy).toBeTruthy();
    expect(ariaDescribedBy).toContain("-helper");
  });

  test("does not have aria-describedby when no error exists", () => {
    const field = createMockField();
    render(<TextField field={field} />);

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  test("renders with tooltipText", () => {
    const field = createMockField();
    render(<TextField field={field} label="Test Label" tooltipText="This is a tooltip" />);

    // The tooltip should be passed to FormField - verify label is rendered
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("handles multiple errors and shows only the first one", () => {
    const field = createMockField({
      state: {
        value: "",
        meta: {
          errors: ["Error 1", "Error 2", "Error 3"],
        },
      },
    });

    render(<TextField field={field} />);

    expect(screen.getByText("Error 1")).toBeInTheDocument();
    expect(screen.queryByText("Error 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Error 3")).not.toBeInTheDocument();
  });
});
