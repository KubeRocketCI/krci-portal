// Data: answers of the procedures recorded on the testbed (see ../../__fixtures__/seed.ts). The stories whose names end
// in Synthetic use data derived from the recording (see ../../__fixtures__/synthetic.ts): the testbed lacks those
// states.
// The recording: the first row of the default Runtime page is in the namespace argocd, which no Environment deploys to;
// the rows of the Environments demo / dev (with the codebase test-go-app) and demo / qa follow. The Stage clusters are
// in-cluster and remote-cluster; demo / prod is on remote-cluster.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PLATFORM_LIST_DEFAULT_PAGE_SIZE } from "@my-project/shared";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { withAppProviders, withFailingTrpc } from "@sb/index";
import {
  FORBIDDEN_MESSAGE,
  bodyRows,
  buttonLabels,
} from "@/modules/platform/security/components/defectdojo/__fixtures__/plays";
import { Vulnerabilities } from ".";
import {
  recordedPage,
  recordedUnavailable,
  seedPage,
  TESTBED_NAMESPACE,
  type ListScenario,
  type RecordedPage,
} from "../../__fixtures__/seed";
import {
  SYNTHETIC_TRIAGED_TOTAL,
  syntheticNoActiveFindings,
  syntheticTruncatedTriaged,
} from "../../__fixtures__/synthetic";

const meta = {
  title: "Platform/Security/Vulnerabilities",
  component: Vulnerabilities,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { search: {}, onSearchChange: fn(), namespace: TESTBED_NAMESPACE, clusterName: "in-cluster" },
} satisfies Meta<typeof Vulnerabilities>;

export default meta;
type Story = StoryObj<typeof meta>;

type Scope = ReturnType<typeof within>;

const IN_CLUSTER = "in-cluster (this installation)";
const REMOTE_CLUSTER = "remote-cluster (this installation)";

const DEV_NAMESPACE_OPTION = "krci-demo-dev (demo / dev)";

const STAGE_LINK = "Environment demo / dev";
const DEV_CODEBASE_LINK = "Security findings of test-go-app";
const STAGE_PATH = `/c/in-cluster/cdpipelines/${TESTBED_NAMESPACE}/demo/stages/dev`;
const CODEBASE_PATH = `/c/in-cluster/projects/${TESTBED_NAMESPACE}/test-go-app`;

const seededWith = (page: RecordedPage) => [withAppProviders({ seedQueryCache: seedPage(page) })];

const seeded = (scenario: ListScenario) => seededWith(recordedPage(scenario));

function recordedData(scenario: ListScenario) {
  const { output } = recordedPage(scenario).list;
  if (output.state !== "data") {
    throw new Error(`The recording of ${scenario} holds no data`);
  }
  return output;
}

const group = (canvasElement: HTMLElement, name: string): Scope =>
  within(within(canvasElement).getByRole("group", { name }));

const findingsTable = async (canvasElement: HTMLElement): Promise<Scope> =>
  within(await within(canvasElement).findByRole("table", { name: "Vulnerability findings" }));

/** The title must occur once on the page: `getByText` throws on a repeat. */
async function findingRow(canvasElement: HTMLElement, title: string): Promise<Scope> {
  const row = (await findingsTable(canvasElement)).getByText(title).closest("tr");
  if (!row) {
    throw new Error(`No row of ${title}`);
  }
  return within(row);
}

export const RuntimeDefault: Story = {
  decorators: seeded("runtimeDefault"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);

    await expect(bodyRows(table)).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    for (const name of ["Severity", "Finding", "Vulnerability", "Component", "Fix", "Found in"]) {
      await expect(table.getByRole("columnheader", { name })).toBeVisible();
    }
    await expect(table.queryByRole("columnheader", { name: "Location" })).not.toBeInTheDocument();
    await expect(
      canvas.getByText(`1-${PLATFORM_LIST_DEFAULT_PAGE_SIZE} of ${recordedData("runtimeDefault").total}`)
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeEnabled();
    await expect(canvas.queryByText(/The list holds the/)).not.toBeInTheDocument();

    await expect(buttonLabels(group(canvasElement, "Level"))).toEqual(["Runtime", "Image", "Code"]);
    await expect(group(canvasElement, "Level").getByRole("button", { name: "Runtime" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const clusters = group(canvasElement, "Clusters");
    for (const name of [IN_CLUSTER, REMOTE_CLUSTER]) {
      await expect(clusters.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
      await expect(clusters.getByRole("button", { name })).toBeEnabled();
    }
    await expect(canvas.getByRole("combobox", { name: "Namespace" })).toHaveTextContent("All namespaces");
    await expect(group(canvasElement, "Severity").getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(group(canvasElement, "Finding state").getByRole("button", { name: "Active" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  },
};

export const RuntimeStatesWithoutMitigated: Story = {
  decorators: seeded("runtimeDefault"),
  args: { search: { state: "mitigated" } },
  play: async ({ canvasElement }) => {
    await findingsTable(canvasElement);

    const states = group(canvasElement, "Finding state");
    await expect(buttonLabels(states)).toEqual(["Active", "False positive", "Out of scope", "Risk accepted"]);
    await expect(states.queryByRole("button", { name: "Mitigated" })).not.toBeInTheDocument();
    await expect(states.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const RuntimeFoundIn: Story = {
  decorators: seeded("runtimeDefault"),
  play: async ({ canvasElement }) => {
    const table = await findingsTable(canvasElement);

    // A namespace no Environment deploys to: the place as text, and no link into the portal.
    const argocd = within(bodyRows(table)[0]);
    await expect(argocd.getByText("in-cluster / argocd")).toBeVisible();
    await expect(
      argocd.getByText("statefulset.argocd-application-controller / application-controller : v3.5.3")
    ).toBeVisible();
    await expect(argocd.queryByRole("link", { name: /^Environment / })).not.toBeInTheDocument();
    await expect(argocd.queryByRole("link", { name: /^Security findings of / })).not.toBeInTheDocument();
    await expect(argocd.getByRole("link", { name: /^Finding CVE-2026-77459 / })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/defectdojo\.example\.test\/finding\/\d+$/)
    );

    // The Environment that deploys the codebase: both links, the codebase one focused on the Environment.
    const dev = await findingRow(canvasElement, "CVE-2099-00000 Fixture-PKG-0-0 1.0.0");
    await expect(dev.getByText("in-cluster / krci-demo-dev")).toBeVisible();
    await expect(dev.getByText("deployment.test-go-app / test-go-app : main-20261123-090000")).toBeVisible();
    await expect(dev.getByRole("link", { name: STAGE_LINK })).toHaveAttribute(
      "href",
      expect.stringContaining(STAGE_PATH)
    );
    await expect(dev.getByRole("link", { name: DEV_CODEBASE_LINK })).toHaveAttribute(
      "href",
      expect.stringContaining(`${CODEBASE_PATH}?tab=findings&cdPipeline=demo&stage=dev`)
    );

    // An Environment whose Application is not the codebase's: the Environment link only.
    const qa = await findingRow(canvasElement, "CVE-2099-06000 Fixture-PKG-6-0 1.0.0");
    await expect(qa.getByRole("link", { name: "Environment demo / qa" })).toBeVisible();
    await expect(qa.queryByRole("link", { name: /^Security findings of / })).not.toBeInTheDocument();
  },
};

export const RuntimeSecondPage: Story = {
  args: { search: { page: 2 } },
  decorators: seeded("runtimeSecondPage"),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);

    await expect(bodyRows(table)).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    await expect(
      canvas.getByText(
        `${PLATFORM_LIST_DEFAULT_PAGE_SIZE + 1}-${2 * PLATFORM_LIST_DEFAULT_PAGE_SIZE} of ${recordedData("runtimeSecondPage").total}`
      )
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeEnabled();

    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ page: 3 });

    await userEvent.click(canvas.getByRole("button", { name: "Previous page" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ page: 1 });

    await userEvent.click(group(canvasElement, "Severity").getByRole("button", { name: "Critical" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ severity: "Critical", page: undefined });
  },
};

export const FilterChanges: Story = {
  decorators: seeded("runtimeDefault"),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await findingsTable(canvasElement);

    await step("Level", async () => {
      await userEvent.click(group(canvasElement, "Level").getByRole("button", { name: "Image" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ level: "image", page: undefined });
    });

    await step("Clusters", async () => {
      await userEvent.click(group(canvasElement, "Clusters").getByRole("button", { name: REMOTE_CLUSTER }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({
        cluster: ["in-cluster"],
        namespace: undefined,
        page: undefined,
      });
    });

    await step("Namespace", async () => {
      await userEvent.click(canvas.getByRole("combobox", { name: "Namespace" }));
      const options = within(canvasElement.ownerDocument.body);
      await userEvent.click(await options.findByRole("option", { name: DEV_NAMESPACE_OPTION }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ namespace: "krci-demo-dev", page: undefined });
    });

    await step("Severity", async () => {
      await userEvent.click(group(canvasElement, "Severity").getByRole("button", { name: "Critical" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ severity: "Critical", page: undefined });
    });

    await step("State", async () => {
      await userEvent.click(group(canvasElement, "Finding state").getByRole("button", { name: "False positive" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ state: "falsePositive", page: undefined });
    });

    await step("Vulnerability id and component", async () => {
      await userEvent.type(canvas.getByLabelText("Vulnerability id (exact)"), "CVE-2026-77459");
      await userEvent.type(canvas.getByLabelText("Component (contains)"), "argo");
      await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({
        vulnerabilityId: "CVE-2026-77459",
        component: "argo",
        page: undefined,
      });
    });
  },
};

export const RuntimeWorkloadNamespace: Story = {
  args: { search: { namespace: "krci-demo-dev" } },
  decorators: seeded("runtimeWorkloadNamespace"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);
    const { total, findings } = recordedData("runtimeWorkloadNamespace");
    const rows = bodyRows(table);

    await expect(canvas.getByRole("combobox", { name: "Namespace" })).toHaveTextContent(DEV_NAMESPACE_OPTION);
    await expect(rows).toHaveLength(findings.length);
    await expect(canvas.getByText(`1-${findings.length} of ${total}`)).toBeVisible();
    // The Environment demo / dev deploys to this namespace.
    await expect(table.getAllByText("in-cluster / krci-demo-dev")).toHaveLength(rows.length);
    await expect(table.getAllByRole("link", { name: STAGE_LINK })).toHaveLength(rows.length);
    await expect(table.queryByText(/argocd/)).not.toBeInTheDocument();
  },
};

export const RuntimeRemoteCluster: Story = {
  args: { search: { cluster: ["remote-cluster"] } },
  decorators: seeded("runtimeRemoteCluster"),
  play: async ({ canvasElement, args }) => {
    const table = await findingsTable(canvasElement);
    const rows = bodyRows(table);

    await expect(rows).toHaveLength(recordedData("runtimeRemoteCluster").findings.length);
    await expect(table.getAllByText("remote-cluster / krci-demo-prod")).toHaveLength(rows.length);
    await expect(table.getAllByRole("link", { name: "Environment demo / prod" })).toHaveLength(rows.length);
    await expect(table.getAllByRole("link", { name: DEV_CODEBASE_LINK })).toHaveLength(rows.length);

    const clusters = group(canvasElement, "Clusters");
    await expect(clusters.getByRole("button", { name: REMOTE_CLUSTER })).toHaveAttribute("aria-pressed", "true");
    await expect(clusters.getByRole("button", { name: REMOTE_CLUSTER })).toBeDisabled();
    await expect(clusters.getByRole("button", { name: IN_CLUSTER })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(clusters.getByRole("button", { name: IN_CLUSTER }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      cluster: ["in-cluster", "remote-cluster"],
      namespace: undefined,
      page: undefined,
    });
  },
};

export const RuntimeSeverityCritical: Story = {
  args: { search: { severity: "Critical" } },
  decorators: seeded("runtimeSeverityCritical"),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);

    const severity = group(canvasElement, "Severity");
    await expect(severity.getByRole("button", { name: "Critical" })).toHaveAttribute("aria-pressed", "true");
    await expect(severity.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    await expect(bodyRows(table)).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    await expect(
      canvas.getByText(`1-${PLATFORM_LIST_DEFAULT_PAGE_SIZE} of ${recordedData("runtimeSeverityCritical").total}`)
    ).toBeVisible();
    await expect(table.getAllByText("Critical")).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    await expect(table.queryByText("High")).not.toBeInTheDocument();

    await userEvent.click(severity.getByRole("button", { name: "Critical" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ severity: undefined, page: undefined });
  },
};

export const RuntimeFalsePositive: Story = {
  args: { search: { state: "falsePositive" } },
  decorators: seeded("runtimeFalsePositive"),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);
    const { total, findings } = recordedData("runtimeFalsePositive");

    await expect(group(canvasElement, "Finding state").getByRole("button", { name: "False positive" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(bodyRows(table)).toHaveLength(findings.length);
    await expect(canvas.getByText(`1-${findings.length} of ${total}`)).toBeVisible();

    // The recorded finding is false positive and mitigated, as DefectDojo marks it: the row shows False positive only.
    const row = await findingRow(canvasElement, "CVE-2026-111497 Libbrotli1 1.2.0-3build1");
    await expect(row.getByText("False positive")).toBeVisible();
    await expect(row.queryByText("Mitigated")).not.toBeInTheDocument();
    await expect(row.getByText("in-cluster / argocd")).toBeVisible();

    await userEvent.click(group(canvasElement, "Finding state").getByRole("button", { name: "Active" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ state: undefined, page: undefined });
  },
};

export const RuntimeVulnerabilityId: Story = {
  args: { search: { vulnerabilityId: "CVE-2026-77459" } },
  decorators: seeded("runtimeVulnerabilityId"),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);
    const { findings } = recordedData("runtimeVulnerabilityId");

    await expect(canvas.getByLabelText("Vulnerability id (exact)")).toHaveValue("CVE-2026-77459");
    await expect(bodyRows(table)).toHaveLength(findings.length);
    await expect(table.getAllByText("CVE-2026-77459")).toHaveLength(findings.length);

    await userEvent.clear(canvas.getByLabelText("Vulnerability id (exact)"));
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      vulnerabilityId: undefined,
      component: undefined,
      page: undefined,
    });
  },
};

export const RuntimeComponent: Story = {
  args: { search: { component: "github.com/argo" } },
  decorators: seeded("runtimeComponent"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);
    const { findings } = recordedData("runtimeComponent");

    await expect(canvas.getByLabelText("Component (contains)")).toHaveValue("github.com/argo");
    await expect(bodyRows(table)).toHaveLength(findings.length);
    await expect(table.getAllByText("github.com/argoproj/argo-cd/v3")).toHaveLength(findings.length);
  },
};

export const RuntimeNoMatch: Story = {
  args: { search: { vulnerabilityId: "CVE-1999-0001" } },
  decorators: seeded("runtimeNoMatch"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The recording answers state "data" with total 0: a filter matched no finding.
    await expect(await canvas.findByText("No findings match the filters.")).toBeVisible();
    await expect(canvas.queryByRole("table", { name: "Vulnerability findings" })).not.toBeInTheDocument();
    await expect(canvas.queryByText("No scan data")).not.toBeInTheDocument();
    await expect(canvas.queryByText(/No active findings/)).not.toBeInTheDocument();
    await expect(canvas.queryByText("Rows per page:")).not.toBeInTheDocument();
  },
};

export const RuntimeNoScanData: Story = {
  args: { search: { cluster: ["no-such-cluster"] } },
  decorators: seeded("runtimeNoScanData"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No scan data")).toBeVisible();
    await expect(
      canvas.getByText("The security operator has not reported vulnerability findings for this installation.")
    ).toBeVisible();
    await expect(canvas.queryByRole("table", { name: "Vulnerability findings" })).not.toBeInTheDocument();
    await expect(canvas.queryByText("No findings")).not.toBeInTheDocument();

    const clusters = group(canvasElement, "Clusters");
    for (const name of [IN_CLUSTER, REMOTE_CLUSTER]) {
      await expect(clusters.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    }
  },
};

export const ImageDefault: Story = {
  args: { search: { level: "image" } },
  decorators: seeded("imageDefault"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);

    await expect(group(canvasElement, "Level").getByRole("button", { name: "Image" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(bodyRows(table)).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    await expect(
      canvas.getByText(`1-${PLATFORM_LIST_DEFAULT_PAGE_SIZE} of ${recordedData("imageDefault").total}`)
    ).toBeVisible();

    await expect(canvas.queryByRole("group", { name: "Clusters" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("combobox", { name: "Namespace" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("combobox", { name: "Codebase" })).toHaveTextContent("All codebases");

    const states = group(canvasElement, "Finding state");
    await expect(buttonLabels(states)).toEqual([
      "Active",
      "Mitigated",
      "False positive",
      "Out of scope",
      "Risk accepted",
    ]);

    const openssl = await findingRow(canvasElement, "CVE-2099-1001 Openssl 3.3.1-r0");
    await expect(
      openssl.getByText("main · gitlab.127.0.0.1.nip.io:5050/krci/test-go-app:main-20261123-090000")
    ).toBeVisible();
    await expect(openssl.getByRole("link", { name: DEV_CODEBASE_LINK })).toHaveAttribute(
      "href",
      expect.stringContaining(`${CODEBASE_PATH}?tab=findings`)
    );
    await expect(canvas.queryByRole("link", { name: /^Environment / })).not.toBeInTheDocument();
  },
};

export const ImageCodebase: Story = {
  args: { search: { level: "image", codebase: "test-go-app" } },
  decorators: seeded("imageCodebase"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);
    const { findings } = recordedData("imageCodebase");

    await expect(canvas.getByRole("combobox", { name: "Codebase" })).toHaveTextContent("test-go-app");
    await expect(bodyRows(table)).toHaveLength(findings.length);
    await expect(table.getAllByRole("link", { name: DEV_CODEBASE_LINK })).toHaveLength(findings.length);
    await expect(table.queryByRole("link", { name: "Security findings of krci-gitops" })).not.toBeInTheDocument();
  },
};

export const CodeDefault: Story = {
  args: { search: { level: "code" } },
  decorators: seeded("codeDefault"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);
    const { total, findings } = recordedData("codeDefault");

    await expect(group(canvasElement, "Level").getByRole("button", { name: "Code" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(bodyRows(table)).toHaveLength(findings.length);
    await expect(canvas.getByText(`1-${findings.length} of ${total}`)).toBeVisible();

    await expect(table.getByRole("columnheader", { name: "Location" })).toBeVisible();
    for (const name of ["Vulnerability", "Component", "Fix"]) {
      await expect(table.queryByRole("columnheader", { name })).not.toBeInTheDocument();
    }
    const md5 = await findingRow(canvasElement, "go.lang.security.audit.crypto.use_of_weak_crypto.use-of-md5");
    await expect(md5.getByText("internal/auth/login.go:12")).toBeVisible();
    await expect(md5.getByText("feature-login")).toBeVisible();
    await expect(md5.getByRole("link", { name: DEV_CODEBASE_LINK })).toBeVisible();
  },
};

export const NotConfigured: Story = {
  decorators: seededWith(recordedUnavailable("notConfigured")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("DefectDojo is not connected")).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Learn more/ })).toHaveAttribute(
      "href",
      expect.stringContaining("defectdojo")
    );
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("group", { name: "Clusters" })).not.toBeInTheDocument();
    await expect(group(canvasElement, "Level").getByRole("button", { name: "Runtime" })).toBeEnabled();
  },
};

export const Unreachable: Story = {
  decorators: seededWith(recordedUnavailable("unreachable")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = await canvas.findByRole("alert");
    await expect(within(alert).getByText("DefectDojo is unreachable")).toBeVisible();
    await expect(within(alert).getByText("Vulnerabilities cannot be loaded.")).toBeVisible();
    // The page asks again on mount, as it does after an outage; the button is off while it does.
    await waitFor(() => expect(within(alert).getByRole("button", { name: "Retry" })).toBeEnabled());
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(alert).not.toHaveTextContent(/https?:|token/i);
  },
};

export const KubernetesReadFailed: Story = {
  decorators: [withFailingTrpc(FORBIDDEN_MESSAGE), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = await canvas.findByRole("alert");
    await expect(within(alert).getByText("Failed to load security findings")).toBeVisible();
    await expect(within(alert).getByText(FORBIDDEN_MESSAGE)).toBeVisible();
    await waitFor(() => expect(within(alert).getByRole("button", { name: "Retry" })).toBeEnabled());
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
  },
};

export const RuntimeTriagedTruncatedSynthetic: Story = {
  args: { search: { state: "falsePositive" } },
  decorators: seededWith(syntheticTruncatedTriaged()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await findingsTable(canvasElement);

    await expect(
      canvas.getByText(
        `The list holds the ${SYNTHETIC_TRIAGED_TOTAL} most severe findings of this state; DefectDojo has more.`
      )
    ).toBeVisible();
    await expect(bodyRows(table)).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    await expect(canvas.getByText(`1-${PLATFORM_LIST_DEFAULT_PAGE_SIZE} of ${SYNTHETIC_TRIAGED_TOTAL}`)).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeEnabled();
  },
};

export const RuntimeNoActiveFindingsSynthetic: Story = {
  decorators: seededWith(syntheticNoActiveFindings()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No findings")).toBeVisible();
    await expect(canvas.getByText("No active findings.")).toBeVisible();
    await expect(canvas.queryByText("No findings match the filters.")).not.toBeInTheDocument();
    await expect(canvas.queryByText("No scan data")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("table", { name: "Vulnerability findings" })).not.toBeInTheDocument();
  },
};
