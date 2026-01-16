import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarProvider } from "./index";

const meta = {
  title: "Core/UI/Sidebar",
  component: SidebarProvider,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SidebarProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <aside className="bg-sidebar w-64 border-r p-4">
          <h3 className="font-semibold">Sidebar</h3>
          <ul className="mt-4 space-y-2">
            <li>Menu Item 1</li>
            <li>Menu Item 2</li>
            <li>Menu Item 3</li>
          </ul>
        </aside>
        <main className="flex-1 p-8">
          <p>Main content area</p>
        </main>
      </div>
    </SidebarProvider>
  ),
};
