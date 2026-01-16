import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormFieldGroup } from "./index";
import { FormField } from "../form-field";
import { Input } from "../input";

const meta = {
  title: "Core/UI/FormFieldGroup",
  component: FormFieldGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FormFieldGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
    className: "w-[400px]",
  },
  render: (args) => (
    <FormFieldGroup {...args}>
      <FormField label="First Name">
        <Input placeholder="Enter first name" />
      </FormField>
      <FormField label="Last Name">
        <Input placeholder="Enter last name" />
      </FormField>
      <FormField label="Email">
        <Input type="email" placeholder="Enter email" />
      </FormField>
    </FormFieldGroup>
  ),
};
