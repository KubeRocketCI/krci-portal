// Data: answers of the procedures recorded on the testbed (see __fixtures__/seed.ts).
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import type { ScanFindings } from "@my-project/shared";
import type { AppRouter } from "@my-project/trpc";
import { createTRPCClient, TRPCClientError, type OperationResultEnvelope } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import { TRPCContext } from "@/core/providers/trpc/context";
import { SecurityFindingsTab } from ".";
import { recordedCodebase, seedCodebaseFindings, TESTBED_NAMESPACE } from "./__fixtures__/seed";

const OWN_IMAGE = "gitlab.127.0.0.1.nip.io:5050/krci/test-go-app";
const THIRD_PARTY_IMAGE = "busybox";

const meta = {
  title: "Platform/Codebases/SecurityFindingsTab",
  component: SecurityFindingsTab,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { codebaseName: "test-go-app", namespace: TESTBED_NAMESPACE },
} satisfies Meta<typeof SecurityFindingsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

function seeded(
  codebaseName: string,
  scenario: Parameters<typeof recordedCodebase>[0],
  { withFindings = true }: { withFindings?: boolean } = {}
) {
  const recorded = recordedCodebase(scenario);
  const seed = withFindings ? recorded : { ...recorded, scanFindings: [] };

  return [withAppProviders({ seedQueryCache: seedCodebaseFindings(codebaseName, seed) })];
}

/** The scan row of a scanner and a target: "Source code" or the image. */
function scanRow(canvasElement: HTMLElement, scanner: string, target: string) {
  const row = within(canvasElement)
    .getAllByTestId("scan-row")
    .find((candidate) => within(candidate).queryByText(scanner) && within(candidate).queryByText(target));
  if (!row) {
    throw new Error(`No row of ${scanner}, ${target}`);
  }
  return within(row);
}

async function expandScan(canvasElement: HTMLElement, scanner: string, target: string) {
  await userEvent.click(
    await within(canvasElement).findByRole("button", { name: `Show findings of ${scanner}, ${target}` })
  );
}

const findingsTable = (canvasElement: HTMLElement, scanner: string, target: string) =>
  within(canvasElement).findByRole("table", { name: `Findings of ${scanner}, ${target}` });

/** Rows of the findings table of a scan, the header included. */
const findingRows = async (canvasElement: HTMLElement, scanner: string, target: string) =>
  within(await findingsTable(canvasElement, scanner, target)).getAllByRole("row");

export const Data: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await within(await canvas.findByTestId("section-code")).findByText("Semgrep JSON Report");
    const image = within(canvas.getByTestId("section-image"));

    await expect(canvas.getByRole("table", { name: "Security scans of test-go-app" })).toBeVisible();
    await expect(canvas.getByText("Gitleaks Scan")).toBeVisible();
    await expect(image.getAllByText("Trivy Scan")).toHaveLength(2);
    await expect(image.getByText("Anchore Grype")).toBeVisible();
    await expect(image.getAllByText("Own image")).toHaveLength(2);
    // A branch that has no CodebaseBranch is not shown.
    await expect(canvas.queryByText("feature-login")).not.toBeInTheDocument();
    // The two scanners of the own image report different counts, and the page adds neither.
    await expect(scanRow(canvasElement, "Trivy Scan", OWN_IMAGE).getByLabelText("High: 2")).toBeVisible();
    await expect(scanRow(canvasElement, "Anchore Grype", OWN_IMAGE).getByLabelText("High: 1")).toBeVisible();
    await expect(canvas.queryByLabelText("High: 3")).not.toBeInTheDocument();
    await expect(canvas.queryByText("No scan data")).not.toBeInTheDocument();
  },
};

export const ThirdPartyImage: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // An image of the chart is apart from the own image, with counts of its own.
    const busybox = await waitFor(() => scanRow(canvasElement, "Trivy Scan", THIRD_PARTY_IMAGE));
    await expect(busybox.getByText("Third-party image")).toBeVisible();
    await expect(busybox.queryByText("Own image")).not.toBeInTheDocument();
    await expect(busybox.getByLabelText("High: 1")).toBeVisible();
    await expect(scanRow(canvasElement, "Trivy Scan", OWN_IMAGE).getByText("Own image")).toBeVisible();

    await expandScan(canvasElement, "Trivy Scan", THIRD_PARTY_IMAGE);
    const findings = within(await findingsTable(canvasElement, "Trivy Scan", THIRD_PARTY_IMAGE));

    // Header and the two active findings of this image only.
    await expect(findings.getAllByRole("row")).toHaveLength(3);
    await expect(canvas.queryByRole("table", { name: `Findings of Trivy Scan, ${OWN_IMAGE}` })).not.toBeInTheDocument();
  },
};

export const ImageFindings: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expandScan(canvasElement, "Trivy Scan", OWN_IMAGE);
    const findings = within(await findingsTable(canvasElement, "Trivy Scan", OWN_IMAGE));

    // Active findings by default, most severe first: the header and four rows.
    await expect(findings.getAllByRole("row")).toHaveLength(5);
    await expect(findings.getAllByText(/^CVE-/)[0]).toBeVisible();
    await expect(findings.getAllByText("Fix available").length).toBeGreaterThan(0);

    await userEvent.click(canvas.getByRole("button", { name: "Critical" }));
    await expect(canvas.getByRole("button", { name: "Critical" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(async () => expect(await findingRows(canvasElement, "Trivy Scan", OWN_IMAGE)).toHaveLength(2));

    await userEvent.click(canvas.getByRole("button", { name: "Critical" }));
    await expect(canvas.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(async () => expect(await findingRows(canvasElement, "Trivy Scan", OWN_IMAGE)).toHaveLength(5));
  },
};

export const TriagedFindings: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expandScan(canvasElement, "Trivy Scan", OWN_IMAGE);
    await userEvent.click(await canvas.findByRole("switch", { name: "Show triaged (5)" }));

    // 4 active and 5 triaged findings, with the header; a triaged one is marked with its state.
    await waitFor(async () => expect(await findingRows(canvasElement, "Trivy Scan", OWN_IMAGE)).toHaveLength(10));
    await expect(
      within(await findingsTable(canvasElement, "Trivy Scan", OWN_IMAGE)).getAllByText("Mitigated").length
    ).toBeGreaterThan(0);
  },
};

export const NoFindingsMatchTheFilter: Story = {
  args: { codebaseName: "krci-gitops" },
  decorators: seeded("krci-gitops", "krciGitops"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gitopsImage = "gitlab.127.0.0.1.nip.io:5050/krci/krci-gitops";

    await expandScan(canvasElement, "Trivy Scan", gitopsImage);
    await expect(await findingsTable(canvasElement, "Trivy Scan", gitopsImage)).toBeVisible();

    // The scan holds a High and a Low finding, and no Critical one.
    await userEvent.click(canvas.getByRole("button", { name: "Critical" }));

    await expect(await canvas.findByText("No findings match the filters.")).toBeVisible();
    await expect(
      canvas.queryByRole("table", { name: `Findings of Trivy Scan, ${gitopsImage}` })
    ).not.toBeInTheDocument();
    await expect(canvas.queryByText(/No active findings/)).not.toBeInTheDocument();
  },
};

/** A tRPC client that answers every call with `answer`: what a scan row gets when it opens its findings. */
function answeringWith(answer: ScanFindings): Decorator {
  const client = createTRPCClient<AppRouter>({
    links: [
      () => () =>
        observable<OperationResultEnvelope<unknown, TRPCClientError<AppRouter>>, TRPCClientError<AppRouter>>(
          (observer) => {
            observer.next({ result: { type: "data", data: answer } });
            observer.complete();
          }
        ),
    ],
  });

  return (Story) => (
    <TRPCContext.Provider value={client}>
      <Story />
    </TRPCContext.Provider>
  );
}

export const FindingsUnreachable: Story = {
  decorators: [answeringWith({ state: "unreachable" }), ...seeded("test-go-app", "testGoApp", { withFindings: false })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expandScan(canvasElement, "Trivy Scan", OWN_IMAGE);

    // Only the expansion fails: the matrix and its counts stay.
    const alert = await canvas.findByRole("alert");
    await expect(within(alert).getByText("DefectDojo is unreachable")).toBeVisible();
    await expect(within(alert).getByText(/Findings cannot be loaded/)).toBeVisible();
    await expect(within(alert).getByRole("button", { name: "Retry" })).toBeEnabled();
    await expect(canvas.queryByRole("table", { name: `Findings of Trivy Scan, ${OWN_IMAGE}` })).not.toBeInTheDocument();
    await expect(scanRow(canvasElement, "Trivy Scan", OWN_IMAGE).getByLabelText("High: 2")).toBeVisible();
  },
};

export const FindingsNoScanData: Story = {
  decorators: [answeringWith({ state: "noScanData" }), ...seeded("test-go-app", "testGoApp", { withFindings: false })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expandScan(canvasElement, "Trivy Scan", OWN_IMAGE);

    await expect(await canvas.findByText("DefectDojo holds no data for this scan any more.")).toBeVisible();
    await expect(canvas.queryByRole("table", { name: `Findings of Trivy Scan, ${OWN_IMAGE}` })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

export const CodeFindings: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    await expandScan(canvasElement, "Semgrep JSON Report", "Source code");
    const findings = within(await findingsTable(canvasElement, "Semgrep JSON Report", "Source code"));

    // A code finding names its file and line.
    await expect(findings.getByText("cmd/server/main.go:17")).toBeVisible();
    await expect(findings.queryByRole("columnheader", { name: "Fix" })).not.toBeInTheDocument();
  },
};

export const SecretFindings: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    await expandScan(canvasElement, "Gitleaks Scan", "Source code");
    const findings = within(await findingsTable(canvasElement, "Gitleaks Scan", "Source code"));

    await expect(findings.getByText("config/app.env:3")).toBeVisible();
    await expect(findings.getByText("deploy/values.yaml:21")).toBeVisible();
  },
};

export const CleanLevel: Story = {
  args: { codebaseName: "krci-gitops" },
  decorators: seeded("krci-gitops", "krciGitops"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const code = within(await canvas.findByTestId("section-code"));
    // The Code level has scans and no active finding: "No findings" and the date of the last upload.
    await expect(code.getByText("No findings")).toBeVisible();
    await expect(code.getByText(/Last upload/)).toBeVisible();
    await expect(code.queryByText("No scan data")).not.toBeInTheDocument();
    await expect(within(canvas.getByTestId("section-image")).queryByText("No findings")).not.toBeInTheDocument();

    await expandScan(canvasElement, "Semgrep JSON Report", "Source code");
    await expect(await canvas.findByText(/No active findings\. Last upload/)).toBeVisible();
  },
};

export const NoScanData: Story = {
  args: { codebaseName: "no-such-app" },
  decorators: seeded("no-such-app", "noScanData"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // One dash row per level, naming the producer. A missing scan is not a clean one.
    await expect(await canvas.findAllByText("No scan data")).toHaveLength(2);
    await expect(canvas.getAllByText(/The CI security scan has not reported/)).toHaveLength(2);
    await expect(canvas.getAllByLabelText("Critical: no scan data")).toHaveLength(2);
    await expect(canvas.queryByText("No findings")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("scan-row")).not.toBeInTheDocument();
  },
};

export const NotConfigured: Story = {
  decorators: seeded("test-go-app", "notConfigured"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("DefectDojo is not connected")).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Learn more/ })).toHaveAttribute(
      "href",
      expect.stringContaining("defectdojo")
    );
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
  },
};

export const Unreachable: Story = {
  decorators: seeded("test-go-app", "unreachable"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = await canvas.findByRole("alert");
    await expect(within(alert).getByText("DefectDojo is unreachable")).toBeVisible();
    // The page asks again on mount, as it does after an outage; the button is off while it does.
    await waitFor(() => expect(within(alert).getByRole("button", { name: "Retry" })).toBeEnabled());
    // No stale data, and no address or token.
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(alert).not.toHaveTextContent(/https?:|token/i);
  },
};

const FORBIDDEN_MESSAGE = "Kubernetes API request failed: 403 Forbidden. codebases is forbidden for this user";

/** A tRPC client whose every call fails: the server could not read the codebase. */
const failingClient = createTRPCClient<AppRouter>({
  links: [
    () => () =>
      observable<never, TRPCClientError<AppRouter>>((observer) => {
        observer.error(TRPCClientError.from(new Error(FORBIDDEN_MESSAGE)));
      }),
  ],
});

export const LoadFailed: Story = {
  decorators: [
    (Story) => (
      <TRPCContext.Provider value={failingClient}>
        <Story />
      </TRPCContext.Provider>
    ),
    withAppProviders(),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A failure that is none of the DefectDojo states: the message of the error, and a retry.
    const alert = await canvas.findByRole("alert");
    await expect(within(alert).getByText("Failed to load security findings")).toBeVisible();
    await expect(within(alert).getByText(FORBIDDEN_MESSAGE)).toBeVisible();
    await waitFor(() => expect(within(alert).getByRole("button", { name: "Retry" })).toBeEnabled());
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
  },
};
