import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { CreateCodebaseWizard } from "./index";
import { withAppProviders } from "@sb/index";

const meta = {
  title: "Platform/Codebases/Wizards/CreateCodebaseWizard",
  component: CreateCodebaseWizard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    withAppProviders(),
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateCodebaseWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CreateCodebaseWizard />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/initial setup/i)).toBeInTheDocument();
    await expect(canvas.getByText(/git & project info/i)).toBeInTheDocument();
    await expect(canvas.getByText(/build config/i)).toBeInTheDocument();
    await expect(canvas.getByText(/review and create/i)).toBeInTheDocument();
  },
};

/**
 * Validation on Continue
 * Clicking Continue without filling required fields shows validation errors.
 */
export const ValidationOnContinue: Story = {
  render: () => <CreateCodebaseWizard />,
  play: async ({ canvas }) => {
    const continueButton = canvas.getByRole("button", { name: /continue/i });
    await userEvent.click(continueButton);

    const errorMessages = canvas.queryAllByText(/required|enter|select/i);
    await expect(errorMessages.length).toBeGreaterThan(0);
  },
};

/**
 * Step Navigation
 * Fills the initial setup step and navigates to the next step.
 */
export const StepNavigation: Story = {
  render: () => <CreateCodebaseWizard />,
  play: async ({ canvas }) => {
    // Step 1: select Custom Configuration → Application → Create
    await userEvent.click(canvas.getByRole("radio", { name: /radio-custom/i }));
    await userEvent.click(canvas.getByRole("radio", { name: /application/i }));
    await userEvent.click(canvas.getByRole("radio", { name: /radio-create/i }));
    await userEvent.click(canvas.getByRole("button", { name: /continue/i }));

    // Step 2: fill Component Name
    const nameInput = await canvas.findByPlaceholderText(/enter component name/i);
    await userEvent.type(nameInput, "test-codebase");
    await expect(nameInput).toHaveValue("test-codebase");
  },
};
