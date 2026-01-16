import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "@tanstack/react-form";
import { Select } from "./index";

const meta = {
  title: "Core/Components/Form/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const simpleOptions = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
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
            //@ts-expect-error TEMPORARY
            <Select field={field} label="Select an option" options={simpleOptions} placeholder="Choose an option" />
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
        selection: "option2",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="selection">
          {(field) => (
            //@ts-expect-error TEMPORARY
            <Select field={field} label="Pre-selected Option" options={simpleOptions} placeholder="Choose an option" />
          )}
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
            //@ts-expect-error TEMPORARY
            <Select field={field} label="Framework" options={frameworks} placeholder="Choose a framework" />
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
            <Select
              //@ts-expect-error TEMPORARY
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
          {(field) => (
            //@ts-expect-error TEMPORARY
            <Select field={field} label="Readonly Selection" options={simpleOptions} disabled={true} />
          )}
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
            <Select
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
            //@ts-expect-error TEMPORARY
            <Select field={field} label="Subscription Plan" options={plans} placeholder="Choose your plan" />
          )}
        </form.Field>
      </div>
    );
  },
};
