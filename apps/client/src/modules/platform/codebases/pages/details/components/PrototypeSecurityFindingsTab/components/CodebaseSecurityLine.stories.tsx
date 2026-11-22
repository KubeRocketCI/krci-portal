// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Fixtures: recorded from the testbed DefectDojo by `packages/trpc/scripts/prototype-defectdojo-record.ts`.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import codebaseScopes from "@/modules/platform/security/prototype-defectdojo/__fixtures__/codebase-scopes.json";
import defectDojoTestbed from "@/modules/platform/security/prototype-defectdojo/__fixtures__/defectdojo-testbed.json";
import {
  createFixtureDefectDojoApi,
  type PrototypeDefectDojoFixtureMode,
} from "@/modules/platform/security/prototype-defectdojo/api/fixtureApi";
import { CodebaseSecurityLine } from "./CodebaseSecurityLine";

interface HarnessProps {
  /** A codebase of `codebase-scopes.json`. */
  codebaseName: string;
  mode: PrototypeDefectDojoFixtureMode;
  /** Drops the Environments of the scope: Runtime has no scan data. */
  withoutEnvironments?: boolean;
}

function Harness({ codebaseName, mode, withoutEnvironments = false }: HarnessProps) {
  const api = React.useMemo(() => createFixtureDefectDojoApi(defectDojoTestbed, mode), [mode]);
  const recorded = codebaseScopes.find((candidate) => candidate.codebaseName === codebaseName);

  const scope = React.useMemo(
    () => (recorded && withoutEnvironments ? { ...recorded, environments: [] } : recorded),
    [recorded, withoutEnvironments]
  );

  if (!scope) {
    return <p>No recorded scope for {codebaseName}.</p>;
  }

  return <CodebaseSecurityLine scope={scope} portalClusterName="in-cluster" api={api} />;
}

const meta: Meta<typeof Harness> = {
  title: "Prototype/DefectDojo/Codebase Overview Line",
  component: Harness,
  decorators: [withAppProviders()],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Harness>;

export const Data: Story = {
  args: { codebaseName: "test-go-app", mode: "recorded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const line = await canvas.findByTestId("codebase-security-line");
    // Code: two clean scans. Image: Anchore Grype reports the most severe findings. Runtime: the Environment is named.
    await waitFor(() => expect(within(canvas.getByTestId("line-code")).getByText("Clean")).toBeVisible());
    await expect(within(canvas.getByTestId("line-image")).getByLabelText("Critical: 7")).toBeVisible();
    await expect(within(canvas.getByTestId("line-image")).getByText("Anchore Grype")).toBeVisible();
    await expect(within(canvas.getByTestId("line-runtime")).getByLabelText("High: 2")).toBeVisible();
    await expect(line).toHaveAttribute("href", expect.stringContaining("tab=findings"));
  },
};

export const RuntimeNoScanData: Story = {
  args: { codebaseName: "test-go-app", mode: "recorded", withoutEnvironments: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(within(canvas.getByTestId("line-image")).getByLabelText("Critical: 7")).toBeVisible());
    await expect(within(canvas.getByTestId("line-runtime")).getByText(/No scan data/)).toBeVisible();
  },
};

export const NoScanData: Story = {
  args: { codebaseName: "test-node-app", mode: "recorded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByText(/No scan data/)).toHaveLength(3));
    await expect(canvas.queryByText("Clean")).not.toBeInTheDocument();
  },
};

export const NotConfigured: Story = {
  args: { codebaseName: "test-go-app", mode: "notConfigured" },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("DefectDojo is not connected")).toBeVisible();
  },
};

export const Unreachable: Story = {
  args: { codebaseName: "test-go-app", mode: "unreachable" },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("DefectDojo is unreachable")).toBeVisible();
  },
};
