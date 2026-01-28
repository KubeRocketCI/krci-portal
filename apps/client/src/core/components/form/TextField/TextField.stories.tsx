import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { useAppForm } from "@/core/form-temp";
import { TextField } from "./index";

const meta = {
  title: "Core/Components/Form/TextField",
  component: TextField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
  args: {} as Story["args"],
  render: () => {
    const form = useAppForm({
      defaultValues: {
        name: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="name">
          {/* @ts-expect-error TEMPORARY */}
          {(field) => <TextField field={field} label="Name" placeholder="Enter your name" />}
        </form.Field>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Name")).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("Enter your name")).toBeInTheDocument();
  },
} satisfies Story;

export const WithValue = {
  args: {} as Story["args"],
  render: () => {
    const form = useAppForm({
      defaultValues: {
        email: "user@example.com",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="email">
          {/* @ts-expect-error TEMPORARY */}
          {(field) => <TextField field={field} label="Email" placeholder="Enter your email" />}
        </form.Field>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox")).toHaveValue("user@example.com");
  },
} satisfies Story;

export const WithTooltip = {
  args: {} as Story["args"],
  render: () => {
    const form = useAppForm({
      defaultValues: {
        username: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="username">
          {(field) => (
            <TextField
              //@ts-expect-error TEMPORARY
              field={field}
              label="Username"
              placeholder="Choose a username"
              tooltipText="Username must be unique and at least 3 characters long"
            />
          )}
        </form.Field>
      </div>
    );
  },
} satisfies Story;

export const Disabled = {
  args: {} as Story["args"],
  render: () => {
    const form = useAppForm({
      defaultValues: {
        readonly: "This field is disabled",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="readonly">
          {/* @ts-expect-error TEMPORARY */}
          {(field) => <TextField field={field} label="Readonly Field" disabled={true} />}
        </form.Field>
      </div>
    );
  },
} satisfies Story;

export const WithValidation = {
  args: {} as Story["args"],
  render: () => {
    const form = useAppForm({
      defaultValues: {
        email: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Email is required";
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Please enter a valid email address";
              }
              return undefined;
            },
          }}
        >
          {/* @ts-expect-error TEMPORARY */}
          {(field) => <TextField field={field} label="Email" placeholder="Enter your email" />}
        </form.Field>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Email");

    // Type invalid email → format error
    await userEvent.type(input, "not-an-email");
    await expect(canvas.getByText("Please enter a valid email address")).toBeInTheDocument();
    await expect(input).toHaveAttribute("aria-invalid", "true");

    const ariaDescribedBy = input.getAttribute("aria-describedby");
    await expect(ariaDescribedBy).toBeTruthy();
    await expect(ariaDescribedBy).toContain("-helper");

    // Clear → required error (only first error shown)
    await userEvent.clear(input);
    await expect(canvas.getByText("Email is required")).toBeInTheDocument();
  },
} satisfies Story;

export const MultipleFields = {
  args: {} as Story["args"],
  render: () => {
    const form = useAppForm({
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
      },
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      form.handleSubmit();
    };

    return (
      <div className="w-[400px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <form.Field name="firstName">
            {/* @ts-expect-error TEMPORARY */}
            {(field) => <TextField field={field} label="First Name" placeholder="Enter your first name" />}
          </form.Field>

          <form.Field name="lastName">
            {/* @ts-expect-error TEMPORARY */}
            {(field) => <TextField field={field} label="Last Name" placeholder="Enter your last name" />}
          </form.Field>

          <form.Field name="email">
            {/* @ts-expect-error TEMPORARY */}
            {(field) => <TextField field={field} label="Email" placeholder="Enter your email" />}
          </form.Field>

          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2"
          >
            Submit
          </button>
        </form>
      </div>
    );
  },
} satisfies Story;
