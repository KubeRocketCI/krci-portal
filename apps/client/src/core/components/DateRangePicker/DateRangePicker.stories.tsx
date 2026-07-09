import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { endOfDay, startOfDay } from "date-fns";
import { DateRangePicker, type DateRangePickerValue } from "./index";

const meta = {
  title: "Components/DateRangePicker",
  component: DateRangePicker,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    value: {},
    onChange: () => {},
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function Interactive({ initial }: { initial: DateRangePickerValue }) {
  const [value, setValue] = React.useState<DateRangePickerValue>(initial);
  return (
    <div className="max-w-xs">
      <DateRangePicker label="Date range" placeholder="Any time" value={value} onChange={setValue} />
    </div>
  );
}

export const Empty: Story = {
  render: () => <Interactive initial={{}} />,
};

export const WithRange: Story = {
  render: () => (
    <Interactive
      initial={{
        from: startOfDay(new Date(2026, 6, 1)).toISOString(),
        to: endOfDay(new Date(2026, 6, 8)).toISOString(),
      }}
    />
  ),
};

export const OpenEnded: Story = {
  render: () => <Interactive initial={{ from: startOfDay(new Date(2026, 6, 1)).toISOString() }} />,
};
