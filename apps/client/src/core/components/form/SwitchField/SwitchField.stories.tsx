import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { useForm } from "@tanstack/react-form";
import { SwitchField } from "./index";

const meta = {
  title: "Core/Components/Form/SwitchField",
  component: SwitchField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SwitchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        enabled: false,
      },
    });

    return (
      <div className="flex items-center gap-2">
        <form.Field name="enabled">{(field) => <SwitchField field={field} />}</form.Field>
        <label className="text-sm">Enable feature</label>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const switchElement = canvas.getByRole("switch");
    await expect(switchElement).not.toBeChecked();

    await userEvent.click(switchElement);
    await expect(switchElement).toBeChecked();
  },
};

export const Checked: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        notifications: true,
      },
    });

    return (
      <div className="flex items-center gap-2">
        <form.Field name="notifications">{(field) => <SwitchField field={field} />}</form.Field>
        <label className="text-sm">Enable notifications</label>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch")).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        readonly: true,
      },
    });

    return (
      <div className="flex items-center gap-2">
        <form.Field name="readonly">{(field) => <SwitchField field={field} disabled={true} />}</form.Field>
        <label className="text-muted-foreground text-sm">Disabled switch (cannot be toggled)</label>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch")).toBeDisabled();
  },
};

export const WithValidation: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        termsAccepted: false,
      },
    });

    return (
      <div className="w-[350px] space-y-2">
        <form.Field
          name="termsAccepted"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "You must accept the terms and conditions";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <div className="flex items-center gap-2">
                {/* @ts-expect-error - can ignore this */}
                <SwitchField field={field} />
                <label className="text-sm">I accept the terms and conditions</label>
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="text-destructive mt-1 text-sm">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const switchElement = canvas.getByRole("switch");

    // Click on → valid, no error
    await userEvent.click(switchElement);
    await expect(switchElement).toBeChecked();

    // Click off → invalid, error appears
    await userEvent.click(switchElement);
    await expect(switchElement).not.toBeChecked();
    await expect(switchElement).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByText("You must accept the terms and conditions")).toBeInTheDocument();
  },
};

export const MultipleSettings: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        notifications: true,
        marketing: false,
        analytics: true,
        darkMode: false,
      },
    });

    return (
      <div className="w-[400px] space-y-4 rounded-lg border p-4">
        <h3 className="text-lg font-semibold">Settings</h3>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Notifications</label>
          <form.Field name="notifications">{(field) => <SwitchField field={field} />}</form.Field>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Marketing emails</label>
          <form.Field name="marketing">{(field) => <SwitchField field={field} />}</form.Field>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Analytics</label>
          <form.Field name="analytics">{(field) => <SwitchField field={field} />}</form.Field>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Dark mode</label>
          <form.Field name="darkMode">{(field) => <SwitchField field={field} />}</form.Field>
        </div>
      </div>
    );
  },
};
