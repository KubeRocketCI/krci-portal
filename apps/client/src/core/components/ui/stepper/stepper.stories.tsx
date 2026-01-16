import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperContent,
  StepperTitle,
  StepperIndicator,
  StepperSeparator,
  StepperNav,
} from "./index";
import { Button } from "../button";

const meta = {
  title: "Core/UI/Stepper",
  component: Stepper,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => {
    const [value, setValue] = useState(0);

    return (
      <div className="w-[600px]">
        <Stepper value={value} onValueChange={setValue}>
          <StepperNav>
            <StepperItem step={0}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>Step 1</StepperTitle>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={1}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>Step 2</StepperTitle>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={2}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>Step 3</StepperTitle>
              </StepperTrigger>
            </StepperItem>
          </StepperNav>

          <StepperContent value={0}>
            <div className="p-4">Content for step 1</div>
          </StepperContent>
          <StepperContent value={1}>
            <div className="p-4">Content for step 2</div>
          </StepperContent>
          <StepperContent value={2}>
            <div className="p-4">Content for step 3</div>
          </StepperContent>
        </Stepper>

        <div className="mt-4 flex gap-2">
          <Button onClick={() => setValue((prev) => Math.max(0, prev - 1))} disabled={value === 0}>
            Back
          </Button>
          <Button onClick={() => setValue((prev) => Math.min(2, prev + 1))} disabled={value === 2}>
            Next
          </Button>
        </div>
      </div>
    );
  },
};
