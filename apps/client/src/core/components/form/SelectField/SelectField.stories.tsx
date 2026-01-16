import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "@tanstack/react-form";
import { SelectField } from "./index";

const meta = {
  title: "Core/Components/Form/SelectField",
  component: SelectField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

const simpleOptions = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
];

const countries = [
  { label: "United States", value: "us" },
  { label: "United Kingdom", value: "uk" },
  { label: "Canada", value: "ca" },
  { label: "Australia", value: "au" },
  { label: "Germany", value: "de" },
];

const frameworks = [
  { label: "React", value: "react", icon: <span>⚛️</span> },
  { label: "Vue", value: "vue", icon: <span>🟢</span> },
  { label: "Angular", value: "angular", icon: <span>🔴</span> },
  { label: "Svelte", value: "svelte", icon: <span>🟠</span> },
];

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        selection: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="selection">
          {(field) => (
            <SelectField
              field={field}
              label="Select an option"
              options={simpleOptions}
              placeholder="Choose an option"
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithValue: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        country: "us",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="country">
          {(field) => <SelectField field={field} label="Country" options={countries} placeholder="Select a country" />}
        </form.Field>
      </div>
    );
  },
};

export const WithIcons: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        framework: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="framework">
          {(field) => (
            <SelectField field={field} label="Framework" options={frameworks} placeholder="Choose a framework" />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithTooltip: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        priority: "",
      },
    });

    const priorities = [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
      { label: "Critical", value: "critical" },
    ];

    return (
      <div className="w-[350px]">
        <form.Field name="priority">
          {(field) => (
            <SelectField
              field={field}
              label="Priority Level"
              options={priorities}
              placeholder="Select priority"
              tooltipText="Choose the priority level for this task"
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithHelperText: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        role: "",
      },
    });

    const roles = [
      { label: "Admin", value: "admin" },
      { label: "Editor", value: "editor" },
      { label: "Viewer", value: "viewer" },
    ];

    return (
      <div className="w-[350px]">
        <form.Field name="role">
          {(field) => (
            <SelectField
              field={field}
              label="User Role"
              options={roles}
              placeholder="Select a role"
              helperText="This determines the user's permissions"
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        readonly: "option2",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="readonly">
          {(field) => <SelectField field={field} label="Readonly Selection" options={simpleOptions} disabled={true} />}
        </form.Field>
      </div>
    );
  },
};

export const WithValidation: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        required: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field
          name="required"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Please select an option";
              return undefined;
            },
          }}
        >
          {(field) => (
            <SelectField
              // @ts-expect-error - can ignore this
              field={field}
              label="Required Selection"
              options={simpleOptions}
              placeholder="You must select one"
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithDisabledOptions: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        plan: "",
      },
    });

    const plans = [
      { label: "Free", value: "free" },
      { label: "Basic", value: "basic" },
      { label: "Pro", value: "pro" },
      { label: "Enterprise (Coming Soon)", value: "enterprise", disabled: true },
    ];

    return (
      <div className="w-[350px]">
        <form.Field name="plan">
          {(field) => (
            <SelectField field={field} label="Subscription Plan" options={plans} placeholder="Choose your plan" />
          )}
        </form.Field>
      </div>
    );
  },
};
