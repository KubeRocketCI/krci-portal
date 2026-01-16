import type { Meta, StoryObj } from "@storybook/react-vite";
import { TableUI } from "./index";

const meta = {
  title: "Core/UI/Table",
  component: TableUI,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TableUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <TableUI>
      <thead>
        <tr>
          <th className="p-2 text-left">Name</th>
          <th className="p-2 text-left">Email</th>
          <th className="p-2 text-left">Role</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2">John Doe</td>
          <td className="p-2">john@example.com</td>
          <td className="p-2">Admin</td>
        </tr>
        <tr className="border-b">
          <td className="p-2">Jane Smith</td>
          <td className="p-2">jane@example.com</td>
          <td className="p-2">User</td>
        </tr>
      </tbody>
    </TableUI>
  ),
};
