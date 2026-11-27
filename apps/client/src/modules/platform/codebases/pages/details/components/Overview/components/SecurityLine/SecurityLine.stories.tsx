// Data: answers of `defectDojo.getCodebaseSecurityLine` recorded on the testbed (see Overview/__fixtures__/seed.ts),
// seeded under the key of the line. The stories whose names end in Synthetic use data derived from the recording (see
// Overview/__fixtures__/synthetic.ts): the testbed lacks those phrases.
// The recording, namespace krci: test-go-app has findings on every level, and its own image is scanned by Trivy Scan
// and Anchore Grype; krci-gitops has no Code finding and no Environment; line-fixture, added to the recorder's input
// only, has no CI scan and only closed runtime tests in demo / dev.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { withAppProviders, withFailingTrpc, withPendingTrpc } from "@sb/index";
import {
  TESTBED_NAMESPACE,
  recorded,
  recordedOutage,
  seededStory,
} from "@/modules/platform/codebases/pages/details/components/Overview/__fixtures__/seed";
import { syntheticExposedSecrets } from "@/modules/platform/codebases/pages/details/components/Overview/__fixtures__/synthetic";
import { NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { FORBIDDEN_MESSAGE, codebasePath } from "@/modules/platform/security/components/defectdojo/__fixtures__/plays";
import { SecurityLine } from ".";

const TEST_GO_APP = recorded("test-go-app");
const WITH_FINDINGS = seededStory(TEST_GO_APP);

const meta = {
  title: "Platform/Codebases/SecurityLine",
  component: SecurityLine,
  tags: ["autodocs"],
  args: { codebase: TEST_GO_APP.input, clusterName: "in-cluster" },
} satisfies Meta<typeof SecurityLine>;

export default meta;
type Story = StoryObj<typeof meta>;

type Scope = ReturnType<typeof within>;

/** The whole row opens the "Security Findings" tab of the codebase, whatever it shows. */
async function expectLink(canvas: Scope, codebase: string, title: string | null): Promise<void> {
  const link = await canvas.findByRole("link", { name: `Security findings of ${codebase}` });
  await expect(link).toHaveAttribute("href", `${codebasePath(TESTBED_NAMESPACE, codebase)}?tab=findings`);
  if (title === null) {
    await expect(link).not.toHaveAttribute("title");
  } else {
    await expect(link).toHaveAttribute("title", title);
  }
}

/** An error with a Retry; the row still opens the tab. */
async function expectFailure(canvas: Scope, text: string): Promise<void> {
  await expect(await canvas.findByText(text)).toBeVisible();
  await waitFor(() => expect(canvas.getByRole("button", { name: "Retry" })).toBeEnabled());
  await expectLink(canvas, "test-go-app", null);
}

async function expectLevel(canvas: Scope, level: "code" | "image" | "runtime", words: string[]): Promise<void> {
  const phrase = within(await canvas.findByTestId(`line-${level}`));
  for (const word of words) {
    await expect(phrase.getByText(word)).toBeVisible();
  }
}

const TEST_GO_APP_TITLE =
  "Code: High 1, Semgrep JSON Report; Image: Critical 1, Trivy Scan; Runtime: Critical 1, vulnerabilities, demo / dev";

export const WithFindings: Story = {
  ...WITH_FINDINGS,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Per level the scan with the most severe finding; the counts of Trivy Scan and Anchore Grype are never added.
    await expectLevel(canvas, "code", ["High", "1", "Semgrep JSON Report"]);
    await expectLevel(canvas, "image", ["Critical", "1", "Trivy Scan"]);
    await expectLevel(canvas, "runtime", ["Critical", "1", "vulnerabilities, demo / dev"]);
    await expectLink(canvas, "test-go-app", TEST_GO_APP_TITLE);
    await expect(canvas.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  },
};

export const CleanAndNoScanData: Story = {
  ...seededStory(recorded("krci-gitops")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectLevel(canvas, "code", ["Clean"]);
    await expectLevel(canvas, "image", ["High", "1", "Trivy Scan"]);
    await expectLevel(canvas, "runtime", [`${NO_VALUE} No scan data`]);
    await expectLink(canvas, "krci-gitops", "Code: Clean; Image: High 1, Trivy Scan; Runtime: No scan data");
  },
};

export const NotRunning: Story = {
  ...seededStory(recorded("line-fixture")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectLevel(canvas, "code", [`${NO_VALUE} No scan data`]);
    await expectLevel(canvas, "image", [`${NO_VALUE} No scan data`]);
    await expectLevel(canvas, "runtime", ["Not running"]);
    await expectLink(canvas, "line-fixture", "Code: No scan data; Image: No scan data; Runtime: Not running");
  },
};

export const ExposedSecretsSynthetic: Story = {
  ...seededStory(syntheticExposedSecrets),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectLevel(canvas, "runtime", ["Critical", "2", "exposed secrets, demo / prod"]);
    await expectLink(
      canvas,
      "test-go-app",
      "Code: High 1, Semgrep JSON Report; Image: Critical 1, Trivy Scan; Runtime: Critical 2, exposed secrets, demo / prod"
    );
  },
};

/** A narrow column: the row keeps one line and cuts the phrases; the tooltip of the link carries them whole. */
export const Narrow: Story = {
  ...WITH_FINDINGS,
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
    ...WITH_FINDINGS.decorators,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectLink(canvas, "test-go-app", TEST_GO_APP_TITLE);
    await expect(canvas.getByTestId("codebase-security-line").getBoundingClientRect().height).toBe(40);
    const detail = within(canvas.getByTestId("line-runtime")).getByText("vulnerabilities, demo / dev");
    await expect(detail.scrollWidth).toBeGreaterThan(detail.clientWidth);
  },
};

export const NotConfigured: Story = {
  ...seededStory(recordedOutage("notConfigured", "test-go-app")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("DefectDojo is not connected")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    await expectLink(canvas, "test-go-app", null);
  },
};

export const Unreachable: Story = {
  ...seededStory(recordedOutage("unreachable", "test-go-app")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectFailure(canvas, "DefectDojo is unreachable");
    await expect(canvasElement).not.toHaveTextContent(/https?:|token/i);
  },
};

/** The procedure fails, here with a 403 of Kubernetes: the line shows no text of the error. */
export const LoadFailed: Story = {
  decorators: [withFailingTrpc(FORBIDDEN_MESSAGE), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectFailure(canvas, "Failed to load security findings");
    await expect(canvasElement).not.toHaveTextContent(FORBIDDEN_MESSAGE);
  },
};

export const Loading: Story = {
  decorators: [withPendingTrpc(), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("status")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    await expectLink(canvas, "test-go-app", null);
  },
};
