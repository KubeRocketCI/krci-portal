import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppProviders } from "@sb/index";
import { RollbackDialog } from "./RollbackDialog";

const meta = {
  title: "k8s/Actions/RollbackAction",
  component: RollbackDialog,
  decorators: [withAppProviders()],
} satisfies Meta<typeof RollbackDialog>;
export default meta;

const noopState = { open: true, openDialog: () => {}, closeDialog: () => {} };
const dialogProps = { namespace: "default", name: "frontend" };

export const Loading: StoryObj = {
  parameters: { note: "Mock useDeploymentRevisions to return { isLoading: true }." },
  render: () => <RollbackDialog props={dialogProps} state={noopState} />,
};

export const ErrorState: StoryObj = {
  parameters: {
    note: "Mock useDeploymentRevisions to return { isError: true, error: new Error('boom') }.",
  },
  render: () => <RollbackDialog props={dialogProps} state={noopState} />,
};

export const Empty: StoryObj = {
  parameters: {
    note: "Mock useDeploymentRevisions to return [{revision:1, isCurrent:true,...}].",
  },
  render: () => <RollbackDialog props={dialogProps} state={noopState} />,
};

export const Populated: StoryObj = {
  parameters: {
    note: "Mock useDeploymentRevisions to return 3 revisions, latest non-current pre-selected.",
  },
  render: () => <RollbackDialog props={dialogProps} state={noopState} />,
};

export const LongList: StoryObj = {
  parameters: { note: "Mock useDeploymentRevisions to return 10 revisions." },
  render: () => <RollbackDialog props={dialogProps} state={noopState} />,
};
