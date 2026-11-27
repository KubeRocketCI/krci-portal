// Data: answers of `defectDojo.getEnvironmentSummary` recorded on the testbed (see stage-details/__fixtures__/seed.ts),
// seeded under the key both tabs read. The stories whose names end in Synthetic use data derived from the recording
// (see stage-details/__fixtures__/synthetic.ts): the testbed lacks those states.
// The recording, CDPipeline demo: demo / dev (in-cluster, krci-demo-dev) has Critical 4, High 4, Medium 7, Low 2 and the
// exposed secrets High 1 and Medium 1, 5 running containers, 4 of no codebase, and one that no longer runs. demo / prod
// runs on remote-cluster (krci-demo-prod): High 2 and Medium 1, no exposed secret. demo / qa is clean (its findings
// triaged for the recording). demo / shadow (krci-other-dev) runs one container of no codebase: Critical, High,
// Medium and Low 9 each. demo / nightly has no runtime test.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TRIAGED_RUNTIME_SCAN_LIMIT } from "@my-project/shared";
import { expect, waitFor, within } from "storybook/test";
import { withAppProviders, withFailingTrpc, withPendingTrpc } from "@sb/index";
import {
  recorded,
  recordedOutage,
  seededStory,
} from "@/modules/platform/cdpipelines/pages/stage-details/__fixtures__/seed";
import {
  syntheticApplicationsNotListed,
  syntheticNamespaceNotRunning,
  syntheticSecretsTruncated,
} from "@/modules/platform/cdpipelines/pages/stage-details/__fixtures__/synthetic";
import { FORBIDDEN_MESSAGE, chipLabels } from "@/modules/platform/security/components/defectdojo/__fixtures__/plays";
import { EnvironmentSecuritySummary } from ".";

const meta = {
  title: "CDPipelines/Stage/Environment Security Summary",
  component: EnvironmentSecuritySummary,
  tags: ["autodocs"],
  args: { environment: recorded("demo/dev").input, clusterName: "in-cluster" },
} satisfies Meta<typeof EnvironmentSecuritySummary>;

export default meta;
type Story = StoryObj<typeof meta>;

type Scope = ReturnType<typeof within>;

async function summaryCard(canvasElement: HTMLElement): Promise<Scope> {
  const card = within(await within(canvasElement).findByTestId("environment-security-summary"));
  await expect(card.getByRole("heading", { name: "Runtime security" })).toBeVisible();
  return card;
}

const query = (cluster: string, namespace: string) => `cluster=%5B%22${cluster}%22%5D&namespace=${namespace}`;

async function expectListLinks(card: Scope, cluster: string, namespace: string): Promise<void> {
  await expect(card.getByRole("link", { name: `Vulnerabilities of ${cluster} / ${namespace}` })).toHaveAttribute(
    "href",
    `/c/in-cluster/security/trivy/vulnerabilities?level=runtime&${query(cluster, namespace)}`
  );
  await expect(card.getByRole("link", { name: `Exposed secrets of ${cluster} / ${namespace}` })).toHaveAttribute(
    "href",
    `/c/in-cluster/security/container/exposed-secrets?${query(cluster, namespace)}`
  );
}

export const WithFindings: Story = {
  ...seededStory(recorded("demo/dev")),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    // The vulnerabilities and, apart, the exposed secrets: never added.
    const [vulnerabilities, secrets] = card.getAllByTestId("card-line").map((line: HTMLElement) => within(line));
    await expect(chipLabels(vulnerabilities.getByRole("group", { name: "Vulnerabilities" }))).toEqual([
      "Critical: 4",
      "High: 4",
      "Medium: 7",
      "Low: 2",
      "Info: 0",
    ]);
    await expect(chipLabels(secrets.getByRole("group", { name: "Exposed secrets" }))).toEqual([
      "Critical: 0",
      "High: 1",
      "Medium: 1",
      "Low: 0",
      "Info: 0",
    ]);
    await expectListLinks(card, "in-cluster", "krci-demo-dev");
    await expect(card.getByText("5 workload containers scanned, 4 without a codebase, 1 not running")).toBeVisible();
    await expect(
      card.getByRole("link", { name: "Product in-cluster / krci-demo-dev (opens DefectDojo in a new tab)" })
    ).toHaveAttribute("href", "https://defectdojo.example.test/asset/4");
  },
};

/** The lists open on the cluster of the Stage, not on the portal's. */
export const RemoteCluster: Story = {
  ...seededStory(recorded("demo/prod")),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(chipLabels(card.getByRole("group", { name: "Vulnerabilities" }))).toEqual([
      "Critical: 0",
      "High: 2",
      "Medium: 1",
      "Low: 0",
      "Info: 0",
    ]);
    await expect(card.getByText("No findings")).toBeVisible();
    await expectListLinks(card, "remote-cluster", "krci-demo-prod");
    await expect(card.getByText("1 workload container scanned, 0 without a codebase")).toBeVisible();
  },
};

/** Only workloads of no codebase run here: the list is where they are found. */
export const WithoutCodebase: Story = {
  ...seededStory(recorded("demo/shadow")),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(chipLabels(card.getByRole("group", { name: "Vulnerabilities" }))).toEqual([
      "Critical: 9",
      "High: 9",
      "Medium: 9",
      "Low: 9",
      "Info: 0",
    ]);
    await expect(card.getByText("1 workload container scanned, 1 without a codebase")).toBeVisible();
    await expectListLinks(card, "in-cluster", "krci-other-dev");
  },
};

export const Clean: Story = {
  ...seededStory(recorded("demo/qa")),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(card.getByText("No findings")).toBeVisible();
    await expect(card.getByText(/^Last upload /)).toBeVisible();
    await expect(card.queryByTestId("card-line")).not.toBeInTheDocument();
    // The lists still link: the triaged findings show under the other states.
    await expectListLinks(card, "in-cluster", "krci-demo-qa");
    await expect(card.getByText("1 workload container scanned, 0 without a codebase")).toBeVisible();
  },
};

/** Every runtime test of the namespace is closed: the 6 containers of the recording no longer run. */
export const NotRunningSynthetic: Story = {
  ...seededStory(syntheticNamespaceNotRunning),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(card.getByText("Not running: no workload of the namespace runs.")).toBeVisible();
    await expect(card.queryByRole("link", { name: /^(Vulnerabilities|Exposed secrets) of / })).not.toBeInTheDocument();
    await expect(card.getByText("0 workload containers scanned, 0 without a codebase, 6 not running")).toBeVisible();
    await expect(card.getByRole("link", { name: /^Product in-cluster \/ krci-demo-dev/ })).toBeVisible();
  },
};

/** The user may not list the Argo CD Applications: the counts stay, the codebases are unknown. */
export const ApplicationsNotListedSynthetic: Story = {
  ...seededStory(syntheticApplicationsNotListed),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(card.getAllByTestId("card-line")).toHaveLength(2);
    await expect(
      card.getByText("5 workload containers scanned, codebases unknown (Applications cannot be read), 1 not running")
    ).toBeVisible();
  },
};

export const SecretsTruncatedSynthetic: Story = {
  ...seededStory(syntheticSecretsTruncated),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(
      card.getByText(
        `More than ${TRIAGED_RUNTIME_SCAN_LIMIT} exposed secrets: the ones past that count as vulnerabilities.`
      )
    ).toBeVisible();
  },
};

export const NoScanData: Story = {
  ...seededStory(recorded("demo/nightly")),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(card.getByText("No scan data")).toBeVisible();
    await expect(
      card.getByText("The security operator has not reported Runtime findings for this Environment.")
    ).toBeVisible();
    await expect(card.queryByRole("link")).not.toBeInTheDocument();
  },
};

export const NotConfigured: Story = {
  ...seededStory(recordedOutage("notConfigured")),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(card.getByText("DefectDojo is not connected")).toBeVisible();
    await expect(card.getByRole("link", { name: /Learn more/ })).toHaveAttribute(
      "href",
      expect.stringContaining("defectdojo")
    );
    await expect(card.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  },
};

export const Unreachable: Story = {
  ...seededStory(recordedOutage("unreachable")),
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);
    const alert = within(card.getByRole("alert"));

    await expect(alert.getByText("DefectDojo is unreachable")).toBeVisible();
    await expect(
      alert.getByText("Runtime findings cannot be loaded. The rest of the page is not affected.")
    ).toBeVisible();
    await waitFor(() => expect(alert.getByRole("button", { name: "Retry" })).toBeEnabled());
    await expect(canvasElement).not.toHaveTextContent(/https?:|token/i);
  },
};

/** The procedure fails, here on a Stage the user may not read. */
export const LoadFailed: Story = {
  decorators: [withFailingTrpc(FORBIDDEN_MESSAGE), withAppProviders()],
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);
    const alert = within(await card.findByRole("alert"));

    await expect(alert.getByText("Failed to load security findings")).toBeVisible();
    await expect(alert.getByText(FORBIDDEN_MESSAGE)).toBeVisible();
    await waitFor(() => expect(alert.getByRole("button", { name: "Retry" })).toBeEnabled());
  },
};

export const Loading: Story = {
  decorators: [withPendingTrpc(), withAppProviders()],
  play: async ({ canvasElement }) => {
    const card = await summaryCard(canvasElement);

    await expect(card.getByRole("status")).toBeInTheDocument();
    await expect(card.queryByRole("alert")).not.toBeInTheDocument();
  },
};
