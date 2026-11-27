// Data: answers of `defectDojo.getEnvironmentSummary` recorded on the testbed (see stage-details/__fixtures__/seed.ts),
// seeded under the key both tabs read. The stories whose names end in Synthetic use data derived from the recording
// (see stage-details/__fixtures__/synthetic.ts): the testbed lacks those states.
// The recording, CDPipeline demo, codebase test-go-app: in demo / dev its container test-go-app has Critical 1, High 2,
// Medium 3, Low 1 and one exposed secret, and its container worker no longer runs. demo / qa is clean (its findings
// triaged for the recording). demo / shadow has no Application of test-go-app. demo / nightly has no runtime test.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { withAppProviders, withFailingTrpc, withPendingTrpc } from "@sb/index";
import {
  CODEBASE,
  recorded,
  recordedOutage,
  seededStory,
} from "@/modules/platform/cdpipelines/pages/stage-details/__fixtures__/seed";
import {
  syntheticApplicationNotRunning,
  syntheticApplicationsNotListed,
  syntheticNoVulnerabilityReport,
  syntheticSeveralContainers,
} from "@/modules/platform/cdpipelines/pages/stage-details/__fixtures__/synthetic";
import { NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import {
  FORBIDDEN_MESSAGE,
  chipLabels,
  codebasePath,
} from "@/modules/platform/security/components/defectdojo/__fixtures__/plays";
import { SecurityColumn } from "./Security";

const DEV = recorded("demo/dev");

const meta = {
  title: "CDPipelines/Stage/Security Column",
  component: SecurityColumn,
  tags: ["autodocs"],
  args: { environment: DEV.input, clusterName: "in-cluster", codebase: CODEBASE },
} satisfies Meta<typeof SecurityColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

type Scope = ReturnType<typeof within>;

/** The cell opens the codebase tab on its Environment, whatever it shows. */
async function expectCodebaseLink(canvas: Scope, stage: string): Promise<void> {
  await expect(
    await canvas.findByRole("link", { name: `Security findings of ${CODEBASE} in demo / ${stage}` })
  ).toHaveAttribute(
    "href",
    `${codebasePath(DEV.input.namespace, CODEBASE)}?tab=findings&cdPipeline=demo&stage=${stage}`
  );
}

async function expectDash(canvas: Scope, reason: string): Promise<void> {
  await expect(await canvas.findByText(reason)).toBeVisible();
  await expect(canvas.getByText(NO_VALUE)).toBeInTheDocument();
  await expect(canvas.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
}

/** An error with a retry and no dash: an outage is not missing data. */
async function expectFailure(canvas: Scope, reason: string): Promise<void> {
  await expect(await canvas.findByText(reason)).toBeVisible();
  await expect(canvas.queryByText(NO_VALUE)).not.toBeInTheDocument();
  await waitFor(() => expect(canvas.getByRole("button", { name: "Retry" })).toBeEnabled());
}

export const WithFindings: Story = {
  ...seededStory(DEV),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A chip per severity that has a finding, then the secrets. worker no longer runs: one line, with no name.
    await expect(chipLabels(await canvas.findByRole("group", { name: `Vulnerabilities of ${CODEBASE}` }))).toEqual([
      "Critical: 1",
      "High: 2",
      "Medium: 3",
      "Low: 1",
    ]);
    await expect(canvas.getByText("1 secret")).toBeVisible();
    await expect(canvas.queryByText(CODEBASE)).not.toBeInTheDocument();
    await expect(canvas.queryByText("worker")).not.toBeInTheDocument();
    await expectCodebaseLink(canvas, "dev");
  },
};

/** test-go-app as recorded, istio-proxy beside it with 2 exposed secrets only, and worker. */
export const SeveralContainersSynthetic: Story = {
  ...seededStory(syntheticSeveralContainers),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A line per running container, named; worker has none.
    await expect(await canvas.findByText(CODEBASE)).toBeVisible();
    await expect(chipLabels(canvas.getByRole("group", { name: `Vulnerabilities of ${CODEBASE}` }))).toEqual([
      "Critical: 1",
      "High: 2",
      "Medium: 3",
      "Low: 1",
    ]);
    await expect(canvas.getByText("1 secret")).toBeVisible();
    await expect(canvas.getByText("istio-proxy")).toBeVisible();
    await expect(canvas.queryByRole("group", { name: "Vulnerabilities of istio-proxy" })).not.toBeInTheDocument();
    await expect(canvas.getByText("2 secrets")).toBeVisible();
    await expect(canvas.queryByText("worker")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Clean")).not.toBeInTheDocument();
    await expectCodebaseLink(canvas, "dev");
  },
};

/** The VulnerabilityReport test of test-go-app is missing; its exposed secret stays. */
export const NoVulnerabilityReportSynthetic: Story = {
  ...seededStory(syntheticNoVulnerabilityReport),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No vulnerability report")).toBeVisible();
    await expect(canvas.getByText("1 secret")).toBeVisible();
    await expect(canvas.queryByRole("group")).not.toBeInTheDocument();
    await expectCodebaseLink(canvas, "dev");
  },
};

export const Clean: Story = {
  ...seededStory(recorded("demo/qa")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectDash(canvas, "Clean");
    await expectCodebaseLink(canvas, "qa");
  },
};

/** Every test of the containers of test-go-app is closed. */
export const NotRunningSynthetic: Story = {
  ...seededStory(syntheticApplicationNotRunning),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectDash(canvas, "Not running");
    await expectCodebaseLink(canvas, "dev");
  },
};

/** The codebase tab may still hold the Code and Image scans of a codebase without runtime findings here. */
export const ApplicationNoScanData: Story = {
  ...seededStory(recorded("demo/shadow")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectDash(canvas, "No scan data");
    await expectCodebaseLink(canvas, "shadow");
  },
};

export const NoScanData: Story = {
  ...seededStory(recorded("demo/nightly")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectDash(canvas, "No scan data");
    await expectCodebaseLink(canvas, "nightly");
  },
};

/** The user may not list the Argo CD Applications. */
export const ApplicationsNotListedSynthetic: Story = {
  ...seededStory(syntheticApplicationsNotListed),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectDash(canvas, "Applications cannot be read");
    await expectCodebaseLink(canvas, "dev");
  },
};

export const NotConfigured: Story = {
  ...seededStory(recordedOutage("notConfigured")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectDash(canvas, "DefectDojo is not connected");
    await expectCodebaseLink(canvas, "dev");
  },
};

export const Unreachable: Story = {
  ...seededStory(recordedOutage("unreachable")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectFailure(canvas, "DefectDojo is unreachable");
    await expect(canvasElement).not.toHaveTextContent(/https?:|token/i);
    await expectCodebaseLink(canvas, "dev");
  },
};

/** The procedure fails, here on a Stage the user may not read. */
export const LoadFailed: Story = {
  decorators: [withFailingTrpc(FORBIDDEN_MESSAGE), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectFailure(canvas, "Findings cannot be loaded");
    await expectCodebaseLink(canvas, "dev");
  },
};

export const Loading: Story = {
  decorators: [withPendingTrpc(), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("status")).toBeInTheDocument();
    await expect(canvas.queryByText(NO_VALUE)).not.toBeInTheDocument();
    await expectCodebaseLink(canvas, "dev");
  },
};
