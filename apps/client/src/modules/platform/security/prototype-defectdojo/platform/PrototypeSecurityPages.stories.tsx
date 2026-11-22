// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Fixtures: recorded from the testbed DefectDojo by `packages/trpc/scripts/prototype-defectdojo-record.ts`.
// The testbed holds no secret finding: the Exposed Secrets story shows the clean state.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import defectDojoTestbed from "../__fixtures__/defectdojo-testbed.json";
import platformScopes from "../__fixtures__/platform-scopes.json";
import { createFixtureDefectDojoApi, type PrototypeDefectDojoFixtureMode } from "../api/fixtureApi";
import { SecurityPrototypeView, type SecurityPrototypePage } from "./SecurityPrototypeView";
import type { SecurityOverviewVariantKey } from "./types";

interface HarnessProps {
  page: SecurityPrototypePage;
  variant: SecurityOverviewVariantKey;
  mode: PrototypeDefectDojoFixtureMode;
  /** Search parameters `clusters` and `namespace` of a link from the Stage Overview tab. */
  link?: { cluster: string; namespace: string };
}

function Harness({ page, variant, mode, link }: HarnessProps) {
  const api = React.useMemo(() => createFixtureDefectDojoApi(defectDojoTestbed, mode), [mode]);
  const [pickedClusters, setPickedClusters] = React.useState<string[] | null>(link ? [link.cluster] : null);
  const scope = platformScopes[0];

  return (
    <SecurityPrototypeView
      page={page}
      variant={variant}
      api={api}
      scope={scope}
      pickedClusters={pickedClusters}
      onClustersChange={setPickedClusters}
      initialNamespace={link?.namespace}
      note={scope.note}
    />
  );
}

const meta: Meta<typeof Harness> = {
  title: "Prototype/DefectDojo/Security Pages",
  component: Harness,
  decorators: [withAppProviders()],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Harness>;

/** `shown`: a text the variant renders once the recorded data arrived. */
function overviewDataStory(variant: SecurityOverviewVariantKey, shown: RegExp): Story {
  return {
    args: { page: "overview", variant, mode: "recorded" },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getAllByText(shown).length).toBeGreaterThan(0));
      await expect(canvas.queryByText("No scan data")).not.toBeInTheDocument();
    },
  };
}

function overviewNoScanDataStory(variant: SecurityOverviewVariantKey): Story {
  return {
    args: { page: "overview", variant, mode: "noData" },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getAllByText("No scan data").length).toBeGreaterThan(0));
      await expect(canvas.queryByText("Clean")).not.toBeInTheDocument();
    },
  };
}

function overviewNotConfiguredStory(variant: SecurityOverviewVariantKey): Story {
  return {
    args: { page: "overview", variant, mode: "notConfigured" },
    play: async ({ canvasElement }) => {
      await expect(await within(canvasElement).findByText("DefectDojo is not connected")).toBeVisible();
    },
  };
}

function overviewUnreachableStory(variant: SecurityOverviewVariantKey): Story {
  return {
    args: { page: "overview", variant, mode: "unreachable" },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect((await canvas.findAllByText("DefectDojo is unreachable")).length).toBeGreaterThan(0);
      await expect((await canvas.findAllByRole("button", { name: "Retry" })).length).toBeGreaterThan(0);
    },
  };
}

export const OverviewAData: Story = overviewDataStory("A", /in-cluster \/ krci-demo-dev/);
export const OverviewANoScanData: Story = overviewNoScanDataStory("A");
export const OverviewANotConfigured: Story = overviewNotConfiguredStory("A");
export const OverviewAUnreachable: Story = overviewUnreachableStory("A");

export const OverviewBData: Story = overviewDataStory("B", /^krci-demo-dev$/);
export const OverviewBNoScanData: Story = overviewNoScanDataStory("B");
export const OverviewBNotConfigured: Story = overviewNotConfiguredStory("B");
export const OverviewBUnreachable: Story = overviewUnreachableStory("B");

export const OverviewCData: Story = overviewDataStory("C", /CVE-/);
export const OverviewCNoScanData: Story = overviewNoScanDataStory("C");
export const OverviewCNotConfigured: Story = overviewNotConfiguredStory("C");
export const OverviewCUnreachable: Story = overviewUnreachableStory("C");

export const VulnerabilitiesList: Story = {
  args: { page: "vulnerabilities", variant: "A", mode: "recorded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByText(/CVE-/).length).toBeGreaterThan(0));
    await expect(canvas.getByText("1-25 of 862")).toBeVisible();
  },
};

export const VulnerabilitiesListOfOneNamespace: Story = {
  args: {
    page: "vulnerabilities",
    variant: "A",
    mode: "recorded",
    link: { cluster: "in-cluster", namespace: "krci-demo-dev" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The list opens on the namespace of the Stage: its 16 active findings.
    await expect(await canvas.findByText("1-16 of 16")).toBeVisible();
  },
};

export const ExposedSecretsList: Story = {
  args: { page: "secrets", variant: "A", mode: "recorded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByText(/No exposed secrets in/)).toHaveLength(2));
  },
};
