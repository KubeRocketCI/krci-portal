// Data: answers of the procedures recorded on the testbed (see __fixtures__/seed.ts). The stories whose names end
// in Synthetic use data derived from the recording (see __fixtures__/synthetic.ts): the testbed lacks those states.
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { DEFECTDOJO_MAX_PAGE_SIZE, DEFECTDOJO_SEVERITIES, type ScanFindings } from "@my-project/shared";
import type { AppRouter } from "@my-project/trpc";
import { createTRPCClient, TRPCClientError, type OperationResultEnvelope } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import { withAppProviders, withFailingTrpc } from "@sb/index";
import { TRPCContext } from "@/core/providers/trpc/context";
import { SecurityFindingsTab } from ".";
import { scanFindingsKey } from "./hooks/useScanFindings";
import { recordedCodebase, seedCodebaseFindings, TESTBED_NAMESPACE, type RecordedCodebase } from "./__fixtures__/seed";
import {
  SYNTHETIC_COMPONENT_COUNT,
  syntheticAllNotRunning,
  syntheticFindingsPage,
  syntheticNoActiveFindings,
  syntheticOtherImages,
  syntheticTestGoApp,
} from "./__fixtures__/synthetic";

const OWN_IMAGE = "gitlab.127.0.0.1.nip.io:5050/krci/test-go-app";
const GITOPS_IMAGE = "gitlab.127.0.0.1.nip.io:5050/krci/krci-gitops";
const THIRD_PARTY_IMAGE = "busybox";

// Image tags of the recording: the own-image CI scans and the container of demo / dev, and the container of demo / prod.
const BUILT_TAG = "main-20261123-090000";
const PROD_TAG = "0.9.0";

const DEV = "demo / dev";
const QA = "demo / qa";
const PROD = "demo / prod";

const meta = {
  title: "Platform/Codebases/SecurityFindingsTab",
  component: SecurityFindingsTab,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { codebaseName: "test-go-app", namespace: TESTBED_NAMESPACE, focus: null },
} satisfies Meta<typeof SecurityFindingsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

function seededWith(codebaseName: string, recorded: RecordedCodebase) {
  return [withAppProviders({ seedQueryCache: seedCodebaseFindings(codebaseName, recorded) })];
}

function seeded(
  codebaseName: string,
  scenario: Parameters<typeof recordedCodebase>[0],
  { withFindings = true }: { withFindings?: boolean } = {}
) {
  const recorded = recordedCodebase(scenario);

  return seededWith(codebaseName, withFindings ? recorded : { ...recorded, scanFindings: [] });
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
    // The Code and Image levels hold scans; only the Environment without a runtime test says "No scan data".
    await expect(within(canvas.getByTestId("section-code")).queryByText("No scan data")).not.toBeInTheDocument();
    await expect(image.queryByText("No scan data")).not.toBeInTheDocument();
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

    await expandScan(canvasElement, "Trivy Scan", GITOPS_IMAGE);
    await expect(await findingsTable(canvasElement, "Trivy Scan", GITOPS_IMAGE)).toBeVisible();

    // The scan holds a High and a Low finding, and no Critical one.
    await userEvent.click(canvas.getByRole("button", { name: "Critical" }));

    await expect(await canvas.findByText("No findings match the filters.")).toBeVisible();
    await expect(
      canvas.queryByRole("table", { name: `Findings of Trivy Scan, ${GITOPS_IMAGE}` })
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
    await expect(await canvas.findAllByText("No scan data")).toHaveLength(3);
    await expect(canvas.getAllByText(/The CI security scan has not reported/)).toHaveLength(2);
    await expect(canvas.getAllByText(/The security operator has not reported/)).toHaveLength(1);
    await expect(canvas.getAllByLabelText("Critical: no scan data")).toHaveLength(3);
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

export const LoadFailed: Story = {
  decorators: [withFailingTrpc(FORBIDDEN_MESSAGE), withAppProviders()],
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

function runtimeRow(canvasElement: HTMLElement, container: string, environment: string): HTMLElement {
  const row = within(canvasElement)
    .getAllByTestId("runtime-row")
    .find((candidate) => within(candidate).queryByText(container) && within(candidate).queryByText(environment));
  if (!row) {
    throw new Error(`No row of ${container} in ${environment}`);
  }
  return row;
}

const expandContainer = async (canvasElement: HTMLElement, container: string, environment: string) =>
  userEvent.click(
    await within(canvasElement).findByRole("button", { name: `Show findings of ${container} in ${environment}` })
  );

export const RuntimeData: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const runtime = within(await canvas.findByTestId("section-runtime"));
    await expect(runtime.getByText("Runtime")).toBeVisible();
    await expect(runtime.getByText("Containers of the codebase that run in its Environments")).toBeVisible();

    // The container that runs the own image in demo / dev.
    const row = within(runtimeRow(canvasElement, "test-go-app", DEV));
    await expect(row.getByText("Own image")).toBeVisible();
    await expect(row.getByText("deployment.test-go-app")).toBeVisible();
    await expect(row.getByText("in-cluster / krci-demo-dev")).toBeVisible();
    await expect(row.getByText(BUILT_TAG)).toBeVisible();
    for (const [severity, count] of [
      ["Critical", 1],
      ["High", 2],
      ["Medium", 3],
      ["Low", 1],
      ["Info", 0],
    ] as const) {
      await expect(row.getByLabelText(`${severity}: ${count}`)).toBeVisible();
    }
    await expect(row.getByLabelText("Exposed secrets: 2")).toBeVisible();
    await expect(row.queryByText("No scan data")).not.toBeInTheDocument();

    // Only the Environment without a runtime test says "No scan data".
    await expect(runtime.getAllByText("No scan data")).toHaveLength(1);
    await expect(scanRow(canvasElement, "Trivy Scan", OWN_IMAGE).getByLabelText("High: 2")).toBeVisible();
  },
};

export const RuntimeFindings: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expandContainer(canvasElement, "test-go-app", DEV);

    await expect(await canvas.findByRole("tab", { name: "Vulnerabilities (7)" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    const vulnerabilities = within(
      await canvas.findByRole("table", { name: `Findings of test-go-app in ${DEV}, vulnerabilities` })
    );
    await expect(vulnerabilities.getAllByRole("row")).toHaveLength(8);
    await expect(vulnerabilities.getAllByText("Fix available")).toHaveLength(7);
    await expect(vulnerabilities.getByRole("columnheader", { name: "Fix" })).toBeVisible();
    await expect(vulnerabilities.queryByRole("columnheader", { name: "Location" })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("tab", { name: "Exposed secrets (2)" }));
    const secrets = within(
      await canvas.findByRole("table", { name: `Findings of test-go-app in ${DEV}, exposed secrets` })
    );
    await expect(secrets.getAllByRole("row")).toHaveLength(3);
    await expect(secrets.getByText("/app/fixture-0.env")).toBeVisible();
    await expect(secrets.queryByRole("columnheader", { name: "Fix" })).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("table", { name: `Findings of test-go-app in ${DEV}, vulnerabilities` })
    ).not.toBeInTheDocument();
  },
};

export const RuntimeSecrets: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const row = within(await waitFor(() => runtimeRow(canvasElement, "test-go-app", DEV)));

    // Two secrets, a High and a Medium: never added to the severity cells.
    await expect(row.getByText("Secrets 2")).toBeVisible();
    await expect(row.getByLabelText("Exposed secrets: 2")).toBeVisible();
    await expect(row.getByLabelText("High: 2")).toBeVisible();
    await expect(row.getByLabelText("Medium: 3")).toBeVisible();
    await expect(row.queryByLabelText("High: 3")).not.toBeInTheDocument();
    await expect(row.queryByLabelText("Medium: 4")).not.toBeInTheDocument();
  },
};

export const RuntimeNotRunning: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The worker has only closed tests.
    await canvas.findAllByTestId("runtime-row");
    const row = within(runtimeRow(canvasElement, "worker", DEV));
    await expect(row.getByText("Not running")).toBeVisible();
    await expect(row.getByText("deployment.worker")).toBeVisible();
    await expect(row.getAllByLabelText(/: not running$/)).toHaveLength(DEFECTDOJO_SEVERITIES.length);
    await expect(row.queryByLabelText(/Exposed secrets/)).not.toBeInTheDocument();
    await expect(row.queryByRole("button")).not.toBeInTheDocument();
    await expect(row.queryByRole("link")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /Show findings of worker/ })).not.toBeInTheDocument();

    // The level holds running containers with findings.
    const runtime = within(canvas.getByTestId("section-runtime"));
    await expect(runtime.queryByText("No findings")).not.toBeInTheDocument();
  },
};

export const RuntimeNoScanData: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // demo / qa has an Application and no runtime test.
    const row = within(await canvas.findByTestId("runtime-no-data-row"));
    await expect(row.getByText("No scan data")).toBeVisible();
    await expect(row.getByText(/The security operator has not reported Runtime findings/)).toBeVisible();
    await expect(row.getByText(QA)).toBeVisible();
    await expect(row.getByText("in-cluster / krci-demo-qa")).toBeVisible();
    await expect(row.getAllByLabelText("Critical: no scan data")).toHaveLength(1);
    await expect(row.queryByRole("button")).not.toBeInTheDocument();
    await expect(row.queryByText("No findings")).not.toBeInTheDocument();
  },
};

export const RuntimeNoEnvironment: Story = {
  args: { codebaseName: "krci-gitops" },
  decorators: seeded("krci-gitops", "krciGitops"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No Application deploys the codebase.
    const runtime = within(await canvas.findByTestId("section-runtime"));
    await expect(runtime.getByText("No scan data")).toBeVisible();
    await expect(runtime.getByText(/The security operator has not reported Runtime findings/)).toBeVisible();
    await expect(runtime.getByText("The codebase is not deployed to any Environment.")).toBeVisible();
    await expect(canvas.queryByTestId("runtime-row")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("runtime-no-data-row")).not.toBeInTheDocument();
  },
};

export const RuntimeRemoteEnvironment: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The Stage of demo / prod is on another cluster; its container runs another tag than the build.
    const row = within(await waitFor(() => runtimeRow(canvasElement, "test-go-app", PROD)));
    await expect(row.getByText("remote-cluster / krci-demo-prod")).toBeVisible();
    await expect(row.getByText(PROD_TAG)).toBeVisible();
    await expect(row.getByLabelText("High: 2")).toBeVisible();
    await expect(row.getByLabelText("Medium: 1")).toBeVisible();
    // It has no ExposedSecretReport test.
    await expect(row.getByLabelText("Exposed secrets: no report")).toBeVisible();
    await expect(row.queryByLabelText("Exposed secrets: 0")).not.toBeInTheDocument();

    await expandContainer(canvasElement, "test-go-app", PROD);
    await expect(await canvas.findByRole("tab", { name: "Vulnerabilities (3)" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(canvas.getByRole("tab", { name: "Exposed secrets" })).toBeDisabled();
    await expect(
      await canvas.findByRole("table", { name: `Findings of test-go-app in ${PROD}, vulnerabilities` })
    ).toBeVisible();
  },
};

function scrolledElements() {
  const scrollIntoView = spyOn(Element.prototype, "scrollIntoView");
  return { scrollIntoView, restore: () => scrollIntoView.mockRestore() };
}

let scrolled: ReturnType<typeof scrolledElements> | undefined;

const trackScrolling = () => {
  scrolled = scrolledElements();
  return () => scrolled?.restore();
};

export const EnvironmentInFocus: Story = {
  args: { focus: { cdPipeline: "demo", stage: "dev" } },
  beforeEach: trackScrolling,
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findAllByTestId("runtime-row");
    const marked = canvas.getAllByTestId("runtime-row").filter((row) => row.hasAttribute("data-focused"));

    // demo / dev holds two rows: test-go-app, and the worker that is not running.
    await expect(marked).toHaveLength(2);
    for (const row of marked) {
      await expect(row).toHaveAttribute("data-focused", "true");
      await expect(row).toHaveAttribute("aria-current", "true");
      await expect(within(row).getByText(DEV)).toBeVisible();
    }
    await expect(canvasElement.querySelectorAll("[data-focused]")).toHaveLength(2);
    await expect(runtimeRow(canvasElement, "test-go-app", PROD)).not.toHaveAttribute("aria-current");
    await expect(canvas.getByTestId("runtime-no-data-row")).not.toHaveAttribute("data-focused");

    const scroll = scrolled?.scrollIntoView;
    await expect(scroll).toHaveBeenCalledTimes(1);
    await expect(scroll).toHaveBeenCalledWith({ block: "nearest" });
    await expect(scroll?.mock.contexts[0]).toBe(marked[0]);
    await expect(canvasElement.querySelectorAll('[aria-expanded="true"]')).toHaveLength(0);
    await expect(canvas.queryByRole("table", { name: /^Findings of/ })).not.toBeInTheDocument();
  },
};

export const EnvironmentWithoutScanDataInFocus: Story = {
  args: { focus: { cdPipeline: "demo", stage: "qa" } },
  beforeEach: trackScrolling,
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const row = await canvas.findByTestId("runtime-no-data-row");
    await expect(row).toHaveAttribute("data-focused", "true");
    await expect(row).toHaveAttribute("aria-current", "true");
    await expect(canvasElement.querySelectorAll("[data-focused]")).toHaveLength(1);
    await expect(scrolled?.scrollIntoView).toHaveBeenCalledTimes(1);
    await expect(scrolled?.scrollIntoView.mock.contexts[0]).toBe(row);
  },
};

export const UnknownEnvironmentInFocus: Story = {
  args: { focus: { cdPipeline: "demo", stage: "shadow" } },
  beforeEach: trackScrolling,
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // demo / shadow names no Environment of the codebase.
    await canvas.findAllByTestId("runtime-row");
    await expect(canvasElement.querySelectorAll("[data-focused]")).toHaveLength(0);
    await expect(canvasElement.querySelectorAll("[aria-current]")).toHaveLength(0);
    await expect(scrolled?.scrollIntoView).not.toHaveBeenCalled();
  },
};

export const RuntimeLevelNotRunningSynthetic: Story = {
  decorators: seededWith("test-go-app", syntheticTestGoApp(syntheticAllNotRunning)),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const runtime = within(await canvas.findByTestId("section-runtime"));
    await expect(runtime.getAllByText("Not running")).toHaveLength(4);
    await expect(runtime.queryByText("No findings")).not.toBeInTheDocument();
    await expect(runtime.queryByRole("button")).not.toBeInTheDocument();
    await expect(runtime.queryByLabelText(/^(Critical|High|Medium|Low|Info): \d/)).not.toBeInTheDocument();
  },
};

export const RuntimeLevelCleanSynthetic: Story = {
  decorators: seededWith("test-go-app", syntheticTestGoApp(syntheticNoActiveFindings)),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const runtime = within(await canvas.findByTestId("section-runtime"));
    await expect(runtime.getByText("No findings")).toBeVisible();
    await expect(runtime.getByText(/Last upload/)).toBeVisible();
    // The worker stays closed.
    await expect(runtime.getAllByText("Not running")).toHaveLength(1);
    await expect(within(runtimeRow(canvasElement, "test-go-app", DEV)).getByLabelText("High: 0")).toBeVisible();
    await expect(
      within(runtimeRow(canvasElement, "test-go-app", DEV)).getByLabelText("Exposed secrets: 0")
    ).toBeVisible();
  },
};

async function openBuiltVersusRunning(canvasElement: HTMLElement, image = OWN_IMAGE) {
  const canvas = within(canvasElement);

  await expandScan(canvasElement, "Trivy Scan", image);
  await userEvent.click(await canvas.findByRole("tab", { name: "Built vs running" }));
  return within(await canvas.findByRole("group", { name: "Built image" }));
}

const runningCard = (canvasElement: HTMLElement, environment: string) =>
  within(within(canvasElement).getByRole("group", { name: `Running in ${environment}` }));

export const BuiltVersusRunningSameTag: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const built = await openBuiltVersusRunning(canvasElement);
    await expect(built.getByText(BUILT_TAG)).toBeVisible();

    // demo / dev runs the tag that was scanned.
    const dev = runningCard(canvasElement, DEV);
    await expect(dev.getByText("Same image tag")).toBeVisible();
    await expect(dev.queryByText("Different image tags")).not.toBeInTheDocument();
    await expect(dev.getByText(BUILT_TAG)).toBeVisible();
    await expect(dev.getByLabelText("Critical: 1")).toBeVisible();
    await expect(dev.getByLabelText("Medium: 3")).toBeVisible();
    await expect(dev.getByLabelText("Exposed secrets: 2")).toBeVisible();
    await expect(built.getByLabelText("Critical: 1")).toBeVisible();
    await expect(built.getByLabelText("Medium: 1")).toBeVisible();

    // The counts of the two sides are never added.
    await expect(canvas.queryByLabelText("Critical: 2")).not.toBeInTheDocument();
    await expect(canvas.queryByLabelText("Medium: 4")).not.toBeInTheDocument();
  },
};

export const BuiltVersusRunningDifferentTag: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openBuiltVersusRunning(canvasElement);

    // demo / prod runs another tag.
    const prod = runningCard(canvasElement, PROD);
    await expect(prod.getByText("Different image tags")).toBeVisible();
    await expect(prod.getByText(`Built ${BUILT_TAG}, running ${PROD_TAG}`)).toBeVisible();
    await expect(prod.queryByText("Same image tag")).not.toBeInTheDocument();
    await expect(prod.getByLabelText("High: 2")).toBeVisible();
    await expect(prod.getByLabelText("Medium: 1")).toBeVisible();
    await expect(prod.getByText("remote-cluster / krci-demo-prod")).toBeVisible();
    await expect(prod.getByLabelText("Exposed secrets: no report")).toBeVisible();

    // Both Environments that run the image are cards; the worker (another image, not running) is none.
    await expect(canvas.getAllByRole("heading", { name: /^Running in/ })).toHaveLength(2);
    await expect(canvas.queryByText("deployment.worker / worker")).not.toBeInTheDocument();
    await expect(canvas.queryByLabelText("High: 4")).not.toBeInTheDocument();
  },
};

export const BuiltVersusRunningFocusFirst: Story = {
  args: { focus: { cdPipeline: "demo", stage: "prod" } },
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openBuiltVersusRunning(canvasElement);

    const headings = canvas.getAllByRole("heading", { name: /^Running in/ }).map((heading) => heading.textContent);
    await expect(headings).toEqual([`Running in ${PROD}`, `Running in ${DEV}`]);
    await expect(canvas.getByRole("group", { name: `Running in ${PROD}` })).toHaveAttribute("data-focused", "true");
    await expect(canvas.getByRole("group", { name: `Running in ${DEV}` })).not.toHaveAttribute("data-focused");
  },
};

export const BuiltVersusRunningComponents: Story = {
  decorators: seeded("test-go-app", "testGoApp"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const builtLabel = `Built image, Trivy Scan, ${OWN_IMAGE}`;

    await openBuiltVersusRunning(canvasElement);
    await expect(
      canvas.queryByRole("list", { name: `Components with findings, ${builtLabel}` })
    ).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: `Show components of ${builtLabel}` }));
    const built = within(await canvas.findByRole("list", { name: `Components with findings, ${builtLabel}` }));
    await expect(built.getAllByRole("listitem")).toHaveLength(4);
    await expect(built.getByText("openssl")).toBeVisible();

    await userEvent.click(built.getByRole("button", { name: "Show findings of openssl 3.3.1-r0" }));
    await expect(built.getByText("CVE-2099-1001")).toBeVisible();
    await expect(built.getByRole("link", { name: /^Finding CVE-2099-1001/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://defectdojo.example.test/finding/")
    );

    await userEvent.click(canvas.getByRole("button", { name: `Show components of Running in ${DEV}` }));
    const dev = within(await canvas.findByRole("list", { name: `Components with findings, Running in ${DEV}` }));
    await expect(dev.getAllByRole("listitem")).toHaveLength(7);
    await expect(canvas.queryByText(/^Grouped from/)).not.toBeInTheDocument();
  },
};

/** Active findings of the synthetic scan: more than the largest page holds. */
const TRUNCATED_TOTAL = DEFECTDOJO_MAX_PAGE_SIZE + 30;

export const BuiltVersusRunningTruncatedSynthetic: Story = {
  decorators: (() => {
    const recorded = recordedCodebase("testGoApp");
    const built =
      recorded.summary.state === "data"
        ? recorded.summary.levels.image.scans.find((scan) => scan.ownImage && scan.ref.scanner === "Trivy Scan")
        : undefined;
    if (!built) {
      throw new Error("The recording of test-go-app holds no own Trivy scan");
    }

    return [
      withAppProviders({
        seedQueryCache: (queryClient) => {
          seedCodebaseFindings("test-go-app", recorded)(queryClient);
          queryClient.setQueryData(
            scanFindingsKey({
              namespace: TESTBED_NAMESPACE,
              name: "test-go-app",
              scan: built.ref,
              showTriaged: false,
              page: 0,
              pageSize: DEFECTDOJO_MAX_PAGE_SIZE,
            }),
            syntheticFindingsPage(TRUNCATED_TOTAL)
          );
        },
      }),
    ];
  })(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const builtLabel = `Built image, Trivy Scan, ${OWN_IMAGE}`;

    await openBuiltVersusRunning(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: `Show components of ${builtLabel}` }));

    const groups = within(await canvas.findByRole("list", { name: `Components with findings, ${builtLabel}` }));
    await expect(groups.getAllByRole("listitem")).toHaveLength(SYNTHETIC_COMPONENT_COUNT);
    await expect(
      canvas.getByText(
        `Grouped from the ${DEFECTDOJO_MAX_PAGE_SIZE} most severe of ${TRUNCATED_TOTAL} active findings.`
      )
    ).toBeVisible();
  },
};

export const BuiltVersusRunningNoEnvironment: Story = {
  args: { codebaseName: "krci-gitops" },
  decorators: seeded("krci-gitops", "krciGitops"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const built = await openBuiltVersusRunning(canvasElement, GITOPS_IMAGE);
    await expect(built.getByText(GITOPS_IMAGE)).toBeVisible();

    // The codebase is deployed nowhere.
    await expect(await canvas.findAllByText("The codebase is not deployed to any Environment.")).toHaveLength(2);
    await expect(canvas.queryByRole("heading", { name: /^Running in/ })).not.toBeInTheDocument();
  },
};

export const BuiltVersusRunningNoEnvironmentRunsTheImageSynthetic: Story = {
  decorators: seededWith("test-go-app", syntheticTestGoApp(syntheticOtherImages)),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openBuiltVersusRunning(canvasElement);

    // The Environments exist and run other images.
    await expect(await canvas.findByText("No Environment runs this image.")).toBeVisible();
    await expect(canvas.queryByText("The codebase is not deployed to any Environment.")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("heading", { name: /^Running in/ })).not.toBeInTheDocument();
  },
};
