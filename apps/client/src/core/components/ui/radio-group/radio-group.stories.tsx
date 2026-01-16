import type { Meta, StoryObj } from "@storybook/react-vite";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

const meta = {
  title: "Core/UI/RadioGroup",
  component: RadioGroupPrimitive.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroupPrimitive.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <RadioGroupPrimitive.Root defaultValue="option-1" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <RadioGroupPrimitive.Item value="option-1" id="option-1" className="border-primary size-4 rounded-full border">
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <div className="bg-primary size-2 rounded-full" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        <label htmlFor="option-1">Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupPrimitive.Item value="option-2" id="option-2" className="border-primary size-4 rounded-full border">
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <div className="bg-primary size-2 rounded-full" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        <label htmlFor="option-2">Option 2</label>
      </div>
    </RadioGroupPrimitive.Root>
  ),
};
