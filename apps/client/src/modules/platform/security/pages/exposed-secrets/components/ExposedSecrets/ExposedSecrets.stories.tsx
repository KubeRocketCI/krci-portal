// Data: answers of the procedures recorded on the testbed (see ../../__fixtures__/seed.ts). The plays read every value
// from the recording and throw when it lacks what they assert: a Runtime finding with a codebase and one without, a
// finding in each triaged list. The recorder enforces findings in the default lists.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PLATFORM_LIST_DEFAULT_PAGE_SIZE, type DefectDojoSeverity, type PlatformFinding } from "@my-project/shared";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { withAppProviders, withFailingTrpc } from "@sb/index";
import {
  FORBIDDEN_MESSAGE,
  bodyRows,
  buttonLabels,
} from "@/modules/platform/security/components/defectdojo/__fixtures__/plays";
import { ExposedSecrets } from ".";
import {
  SYNTHETIC_CODE_TOTAL,
  SYNTHETIC_TRIAGED_TOTAL,
  syntheticCodeSecondPage,
  syntheticRuntimeNoActiveFindings,
  syntheticTruncatedTriaged,
} from "../../__fixtures__/synthetic";
import {
  recordedList,
  recordedPage,
  recordedUnavailable,
  seedPage,
  TESTBED_NAMESPACE,
  type CodeScenario,
  type RecordedPage,
  type RuntimeScenario,
  type Scenario,
} from "../../__fixtures__/seed";

const meta = {
  title: "Platform/Security/Exposed Secrets",
  component: ExposedSecrets,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { search: {}, onSearchChange: fn(), namespace: TESTBED_NAMESPACE, clusterName: "in-cluster" },
} satisfies Meta<typeof ExposedSecrets>;

export default meta;
type Story = StoryObj<typeof meta>;

type Scope = ReturnType<typeof within>;

const CODE_TITLE = "Secrets in source code";
const RUNTIME_TITLE = "Secrets in running workloads";
const NO_MATCH = "No findings match the filters.";
const RUNTIME_WITHOUT_MITIGATED =
  "Running workloads have no Mitigated state: closing a scan mitigates every finding of its test.";
const STATE_LABELS = ["Active", "Mitigated", "False positive", "Out of scope", "Risk accepted"];
const SECRET_TEXT = /fixture-secret-value|\*\*(?:Secret|Match):\*\*/;

const seededWith = (page: RecordedPage) => [withAppProviders({ seedQueryCache: seedPage(page) })];

const seeded = (scenarios: { code: CodeScenario; runtime: RuntimeScenario | null }) =>
  seededWith(recordedPage(scenarios));

function recordedData(scenario: Scenario) {
  const { output } = recordedList(scenario);
  if (output.state !== "data") {
    throw new Error(`The recording of ${scenario} holds no data`);
  }
  return output;
}

/** The story asserts the empty list: a recording that holds findings must change the story. */
function recordedEmpty(scenario: Scenario): void {
  if (recordedData(scenario).total !== 0) {
    throw new Error(`The recording of ${scenario} holds findings`);
  }
}

function recordedSeverity(scenario: Scenario): DefectDojoSeverity {
  const { severity } = recordedList(scenario).input;
  if (!severity) {
    throw new Error(`The recording of ${scenario} has no severity filter`);
  }
  return severity;
}

function recordedCodebase(scenario: CodeScenario): string {
  const { input } = recordedList(scenario);
  if (input.level !== "code" || !input.codebase) {
    throw new Error(`The recording of ${scenario} has no codebase filter`);
  }
  return input.codebase;
}

function recordedClusters(scenario: RuntimeScenario): string[] {
  const { input } = recordedList(scenario);
  if (input.level !== "runtime" || !input.clusters) {
    throw new Error(`The recording of ${scenario} has no cluster filter`);
  }
  return input.clusters;
}

function recordedWorkloadNamespace(scenario: RuntimeScenario): string {
  const { input } = recordedList(scenario);
  if (input.level !== "runtime" || !input.workloadNamespace) {
    throw new Error(`The recording of ${scenario} has no namespace filter`);
  }
  return input.workloadNamespace;
}

function recordedScope() {
  const { scope } = recordedPage({ code: "codeDefault", runtime: "runtimeDefault" });
  if (scope.state !== "data") {
    throw new Error("The recording of the scope holds no data");
  }
  return scope;
}

function runtimePlace(finding: PlatformFinding) {
  if (finding.place?.level !== "runtime") {
    throw new Error(`The recorded finding ${finding.title} has no Runtime place`);
  }
  return finding.place;
}

function codePlace(finding: PlatformFinding) {
  if (finding.place?.level !== "code") {
    throw new Error(`The recorded finding ${finding.title} has no Code place`);
  }
  return finding.place;
}

const clusterButton = (cluster: string) =>
  recordedScope().stageClusters.includes(cluster) ? `${cluster} (this installation)` : cluster;

function namespaceOption(cluster: string, namespace: string): string {
  const option = recordedScope().namespaces.find((item) => item.cluster === cluster && item.namespace === namespace);
  return option?.environment
    ? `${namespace} (${option.environment.cdPipeline} / ${option.environment.stage})`
    : namespace;
}

const stagePath = (cdPipeline: string, stage: string) =>
  `/c/in-cluster/cdpipelines/${TESTBED_NAMESPACE}/${cdPipeline}/stages/${stage}`;

const codebasePath = (codebase: string) => `/c/in-cluster/projects/${TESTBED_NAMESPACE}/${codebase}`;

const defectDojoLink = (finding: PlatformFinding) => `Finding ${finding.title} (opens DefectDojo in a new tab)`;

const group = (scope: Scope, name: string): Scope => within(scope.getByRole("group", { name }));

const clusterGroup = (canvas: Scope): Scope => group(group(canvas, "Running workloads"), "Clusters");

const card = (canvas: Scope, title: string): Scope => {
  const root = canvas.getByRole("heading", { name: title }).parentElement;
  if (!root) {
    throw new Error(`No card of ${title}`);
  }
  return within(root);
};

const findingsTable = async (list: Scope, caption: string): Promise<Scope> =>
  within(await list.findByRole("table", { name: caption }));

/** The title must occur once in the table: `getByText` throws on a repeat. */
function findingRow(table: Scope, title: string): Scope {
  const row = table.getByText(title).closest("tr");
  if (!row) {
    throw new Error(`No row of ${title}`);
  }
  return within(row);
}

async function expectNoSecretText(canvasElement: HTMLElement): Promise<void> {
  await expect(canvasElement.textContent).not.toMatch(SECRET_TEXT);
}

export const DefaultLists: Story = {
  decorators: seeded({ code: "codeDefault", runtime: "runtimeDefault" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lists = [
      { title: CODE_TITLE, data: recordedData("codeDefault") },
      { title: RUNTIME_TITLE, data: recordedData("runtimeDefault") },
    ];

    await expect(await canvas.findAllByRole("heading", { level: 3 })).toHaveLength(lists.length);
    await expect(canvas.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      CODE_TITLE,
      RUNTIME_TITLE,
    ]);

    for (const { title, data } of lists) {
      const list = card(canvas, title);
      const table = await findingsTable(list, title);

      await expect(bodyRows(table)).toHaveLength(data.findings.length);
      for (const name of ["Severity", "Rule", "File : line", "Found in"]) {
        await expect(table.getByRole("columnheader", { name })).toBeVisible();
      }
      for (const name of ["Finding", "Location"]) {
        await expect(table.queryByRole("columnheader", { name })).not.toBeInTheDocument();
      }
      await expect(list.getByText(`1-${data.findings.length} of ${data.total}`)).toBeVisible();
      await expect(list.getByRole("button", { name: "Previous page" })).toBeDisabled();
      await expect(list.getByRole("button", { name: "Next page" })).toBeDisabled();
      await expect(list.queryByText(/The list holds the/)).not.toBeInTheDocument();
    }

    await expect(group(canvas, "Source code").getByRole("combobox", { name: "Codebase" })).toHaveTextContent(
      "All codebases"
    );

    const runningWorkloads = group(canvas, "Running workloads");
    for (const cluster of recordedScope().defaultClusters) {
      await expect(clusterGroup(canvas).getByRole("button", { name: clusterButton(cluster) })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    }
    await expect(runningWorkloads.getByRole("combobox", { name: "Namespace" })).toHaveTextContent("All namespaces");

    await expect(group(canvas, "Severity").getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const states = group(canvas, "Finding state");
    await expect(buttonLabels(states)).toEqual(STATE_LABELS);
    await expect(states.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");

    await expectNoSecretText(canvasElement);
  },
};

export const FoundIn: Story = {
  decorators: seeded({ code: "codeDefault", runtime: "runtimeDefault" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const codeTable = await findingsTable(card(canvas, CODE_TITLE), CODE_TITLE);
    const runtimeTable = await findingsTable(card(canvas, RUNTIME_TITLE), RUNTIME_TITLE);

    for (const finding of recordedData("codeDefault").findings) {
      const row = findingRow(codeTable, finding.title);
      const place = codePlace(finding);

      await expect(row.getByText(`${finding.filePath}:${finding.line}`)).toBeVisible();
      await expect(row.getByText(place.branch)).toBeVisible();
      await expect(row.getByRole("link", { name: `Security findings of ${place.codebase}` })).toHaveAttribute(
        "href",
        expect.stringContaining(`${codebasePath(place.codebase)}?tab=findings`)
      );
      await expect(row.queryByRole("link", { name: /^Environment / })).not.toBeInTheDocument();
      await expect(row.getByRole("link", { name: defectDojoLink(finding) })).toHaveAttribute("href", finding.url);
    }

    const { findings } = recordedData("runtimeDefault");
    const withCodebase = findings.find((finding) => runtimePlace(finding).codebase !== null);
    const withoutCodebase = findings.find((finding) => runtimePlace(finding).codebase === null);
    if (!withCodebase || !withoutCodebase) {
      throw new Error("The recorded Runtime list needs a finding with a codebase and one without");
    }

    // The Environment that deploys the codebase: both links, the codebase one focused on the Environment.
    const deployedPlace = runtimePlace(withCodebase);
    const { environment, codebase } = deployedPlace;
    if (!environment || !codebase) {
      throw new Error(`The recorded finding ${withCodebase.title} has no Environment or codebase`);
    }
    const deployed = findingRow(runtimeTable, withCodebase.title);
    await expect(deployed.getByText(`${deployedPlace.cluster} / ${deployedPlace.namespace}`)).toBeVisible();
    await expect(
      deployed.getByText(`${deployedPlace.workload} / ${deployedPlace.container} : ${deployedPlace.version}`)
    ).toBeVisible();
    await expect(
      deployed.getByRole("link", { name: `Environment ${environment.cdPipeline} / ${environment.stage}` })
    ).toHaveAttribute("href", expect.stringContaining(stagePath(environment.cdPipeline, environment.stage)));
    await expect(deployed.getByRole("link", { name: `Security findings of ${codebase}` })).toHaveAttribute(
      "href",
      expect.stringContaining(
        `${codebasePath(codebase)}?tab=findings&cdPipeline=${environment.cdPipeline}&stage=${environment.stage}`
      )
    );
    await expect(deployed.getByRole("link", { name: defectDojoLink(withCodebase) })).toHaveAttribute(
      "href",
      withCodebase.url
    );

    // A workload that no Application of a codebase deploys: the Environment link only.
    const unknownEnvironment = runtimePlace(withoutCodebase).environment;
    if (!unknownEnvironment) {
      throw new Error(`The recorded finding ${withoutCodebase.title} has no Environment`);
    }
    const unknown = findingRow(runtimeTable, withoutCodebase.title);
    await expect(
      unknown.getByRole("link", { name: `Environment ${unknownEnvironment.cdPipeline} / ${unknownEnvironment.stage}` })
    ).toBeVisible();
    await expect(unknown.queryByRole("link", { name: /^Security findings of / })).not.toBeInTheDocument();
    await expect(unknown.getByRole("link", { name: defectDojoLink(withoutCodebase) })).toHaveAttribute(
      "href",
      withoutCodebase.url
    );

    await expectNoSecretText(canvasElement);
  },
};

export const FilterChanges: Story = {
  decorators: seeded({ code: "codeDefault", runtime: "runtimeDefault" }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await findingsTable(card(canvas, CODE_TITLE), CODE_TITLE);
    const options = within(canvasElement.ownerDocument.body);
    const pagesReset = { codePage: undefined, runtimePage: undefined };
    const { defaultClusters } = recordedScope();
    const clusters = recordedClusters("runtimeClusterNamespace");
    const workloadNamespace = recordedWorkloadNamespace("runtimeClusterNamespace");
    const codebase = recordedCodebase("codeCodebase");
    const severity = recordedSeverity("runtimeSeverity");

    await step("Codebase", async () => {
      await userEvent.click(canvas.getByRole("combobox", { name: "Codebase" }));
      await userEvent.click(await options.findByRole("option", { name: codebase }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ codebase, ...pagesReset });
    });

    await step("Clusters", async () => {
      const last = defaultClusters[defaultClusters.length - 1];
      await userEvent.click(clusterGroup(canvas).getByRole("button", { name: clusterButton(last) }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({
        cluster: defaultClusters.slice(0, -1),
        namespace: undefined,
        ...pagesReset,
      });
    });

    await step("Namespace", async () => {
      await userEvent.click(canvas.getByRole("combobox", { name: "Namespace" }));
      await userEvent.click(
        await options.findByRole("option", { name: namespaceOption(clusters[0], workloadNamespace) })
      );
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ namespace: workloadNamespace, ...pagesReset });
    });

    await step("Severity", async () => {
      await userEvent.click(group(canvas, "Severity").getByRole("button", { name: severity }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ severity, ...pagesReset });
    });

    await step("State", async () => {
      await userEvent.click(group(canvas, "Finding state").getByRole("button", { name: "False positive" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ state: "falsePositive", ...pagesReset });

      await userEvent.click(group(canvas, "Finding state").getByRole("button", { name: "Mitigated" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ state: "mitigated", ...pagesReset });
    });
  },
};

export const CodebaseFilter: Story = {
  args: { search: { codebase: recordedCodebase("codeCodebase") } },
  decorators: seeded({ code: "codeCodebase", runtime: "runtimeDefault" }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const codebase = recordedCodebase("codeCodebase");
    const code = recordedData("codeCodebase");
    const codeTable = await findingsTable(card(canvas, CODE_TITLE), CODE_TITLE);
    const runtimeTable = await findingsTable(card(canvas, RUNTIME_TITLE), RUNTIME_TITLE);

    await expect(group(canvas, "Source code").getByRole("combobox", { name: "Codebase" })).toHaveTextContent(codebase);
    await expect(
      group(canvas, "Running workloads").queryByRole("combobox", { name: "Codebase" })
    ).not.toBeInTheDocument();
    await expect(bodyRows(codeTable)).toHaveLength(code.findings.length);
    await expect(codeTable.getAllByRole("link", { name: `Security findings of ${codebase}` })).toHaveLength(
      code.findings.length
    );
    await expect(bodyRows(runtimeTable)).toHaveLength(recordedData("runtimeDefault").findings.length);

    await userEvent.click(group(canvas, "Severity").getByRole("button", { name: "Critical" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      codebase,
      severity: "Critical",
      codePage: undefined,
      runtimePage: undefined,
    });
  },
};

export const ClusterAndNamespaceFilter: Story = {
  args: {
    search: {
      cluster: recordedClusters("runtimeClusterNamespace"),
      namespace: recordedWorkloadNamespace("runtimeClusterNamespace"),
    },
  },
  decorators: seeded({ code: "codeDefault", runtime: "runtimeClusterNamespace" }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const clusters = recordedClusters("runtimeClusterNamespace");
    const workloadNamespace = recordedWorkloadNamespace("runtimeClusterNamespace");
    const runtime = recordedData("runtimeClusterNamespace");
    const codeTable = await findingsTable(card(canvas, CODE_TITLE), CODE_TITLE);
    const runtimeTable = await findingsTable(card(canvas, RUNTIME_TITLE), RUNTIME_TITLE);

    await expect(canvas.getByRole("combobox", { name: "Namespace" })).toHaveTextContent(
      namespaceOption(clusters[0], workloadNamespace)
    );
    await expect(bodyRows(runtimeTable)).toHaveLength(runtime.findings.length);
    await expect(runtimeTable.getAllByText(`${clusters[0]} / ${workloadNamespace}`)).toHaveLength(
      runtime.findings.length
    );
    await expect(bodyRows(codeTable)).toHaveLength(recordedData("codeDefault").findings.length);

    const clusterButtons = clusterGroup(canvas);
    const others = recordedScope().defaultClusters.filter((cluster) => !clusters.includes(cluster));
    await expect(clusterButtons.getByRole("button", { name: clusterButton(clusters[0]) })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(clusterButtons.getByRole("button", { name: clusterButton(clusters[0]) })).toBeDisabled();
    for (const cluster of others) {
      await expect(clusterButtons.getByRole("button", { name: clusterButton(cluster) })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    }

    await userEvent.click(clusterButtons.getByRole("button", { name: clusterButton(others[0]) }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      cluster: [...clusters, others[0]].sort((a, b) => a.localeCompare(b)),
      namespace: undefined,
      codePage: undefined,
      runtimePage: undefined,
    });
  },
};

export const SeverityFilter: Story = {
  args: { search: { severity: recordedSeverity("runtimeSeverity") } },
  decorators: seeded({ code: "codeSeverity", runtime: "runtimeSeverity" }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const severity = recordedSeverity("runtimeSeverity");
    const runtime = recordedData("runtimeSeverity");
    const runtimeTable = await findingsTable(card(canvas, RUNTIME_TITLE), RUNTIME_TITLE);
    const code = card(canvas, CODE_TITLE);

    const severityGroup = group(canvas, "Severity");
    await expect(severityGroup.getByRole("button", { name: severity })).toHaveAttribute("aria-pressed", "true");
    await expect(severityGroup.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");

    await expect(bodyRows(runtimeTable)).toHaveLength(runtime.findings.length);
    await expect(runtimeTable.getAllByText(severity)).toHaveLength(runtime.findings.length);

    // The Code list holds no finding of this severity.
    recordedEmpty("codeSeverity");
    await expect(code.getByText(NO_MATCH)).toBeVisible();
    await expect(code.queryByRole("table")).not.toBeInTheDocument();

    await userEvent.click(severityGroup.getByRole("button", { name: severity }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      severity: undefined,
      codePage: undefined,
      runtimePage: undefined,
    });
  },
};

export const TriagedState: Story = {
  args: { search: { state: "falsePositive" } },
  decorators: seeded({ code: "codeTriaged", runtime: "runtimeTriaged" }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const label = "False positive";
    const states = group(canvas, "Finding state");

    await expect(states.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    await expect(states.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "false");

    // DefectDojo marks a false positive mitigated too: the row shows its triage state only.
    for (const [title, scenario] of [
      [CODE_TITLE, "codeTriaged"],
      [RUNTIME_TITLE, "runtimeTriaged"],
    ] as const) {
      const { findings, total } = recordedData(scenario);
      if (findings.length === 0) {
        throw new Error(`The recording of ${scenario} holds no finding: the story asserts its rows`);
      }
      const list = card(canvas, title);
      const table = await findingsTable(list, title);
      await expect(bodyRows(table)).toHaveLength(findings.length);
      await expect(list.getByText(`1-${findings.length} of ${total}`)).toBeVisible();
      for (const finding of findings) {
        const row = findingRow(table, finding.title);
        await expect(row.getByText(label)).toBeVisible();
        await expect(row.queryByText("Mitigated")).not.toBeInTheDocument();
      }
    }
    await expectNoSecretText(canvasElement);

    await userEvent.click(states.getByRole("button", { name: "Active" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      state: undefined,
      codePage: undefined,
      runtimePage: undefined,
    });
  },
};

export const MitigatedState: Story = {
  args: { search: { state: "mitigated" } },
  decorators: seeded({ code: "codeMitigated", runtime: null }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const code = card(canvas, CODE_TITLE);
    const runtime = card(canvas, RUNTIME_TITLE);

    // Mitigated leaves out the false positives, which DefectDojo marks mitigated too.
    recordedEmpty("codeMitigated");
    await expect(await code.findByText(NO_MATCH)).toBeVisible();
    await expect(code.queryByRole("table")).not.toBeInTheDocument();

    await expect(runtime.getByText(RUNTIME_WITHOUT_MITIGATED)).toBeVisible();
    await expect(runtime.queryByRole("table")).not.toBeInTheDocument();
    await expect(runtime.queryByText(NO_MATCH)).not.toBeInTheDocument();

    const states = group(canvas, "Finding state");
    await expect(buttonLabels(states)).toEqual(STATE_LABELS);
    await expect(states.getByRole("button", { name: "Mitigated" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(states.getByRole("button", { name: "Active" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      state: undefined,
      codePage: undefined,
      runtimePage: undefined,
    });
  },
};

export const RuntimeNoScanData: Story = {
  args: { search: { cluster: recordedClusters("runtimeNoScanData") } },
  decorators: seeded({ code: "codeDefault", runtime: "runtimeNoScanData" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = card(canvas, RUNTIME_TITLE);

    await expect(await runtime.findByText("No scan data")).toBeVisible();
    await expect(
      runtime.getByText("The security operator has not reported secret findings for this installation.")
    ).toBeVisible();
    await expect(runtime.queryByRole("table")).not.toBeInTheDocument();
    await expect(runtime.queryByText("No findings")).not.toBeInTheDocument();

    const codeTable = await findingsTable(card(canvas, CODE_TITLE), CODE_TITLE);
    await expect(bodyRows(codeTable)).toHaveLength(recordedData("codeDefault").findings.length);

    for (const cluster of recordedScope().defaultClusters) {
      await expect(clusterGroup(canvas).getByRole("button", { name: clusterButton(cluster) })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    }
  },
};

export const CodeNoScanData: Story = {
  args: { search: { codebase: recordedCodebase("codeNoScanData") } },
  decorators: seeded({ code: "codeNoScanData", runtime: "runtimeDefault" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const code = card(canvas, CODE_TITLE);

    await expect(await code.findByText("No scan data")).toBeVisible();
    await expect(
      code.getByText("The CI security scan has not reported secret findings for this codebase.")
    ).toBeVisible();
    await expect(code.queryByRole("table")).not.toBeInTheDocument();

    const runtimeTable = await findingsTable(card(canvas, RUNTIME_TITLE), RUNTIME_TITLE);
    await expect(bodyRows(runtimeTable)).toHaveLength(recordedData("runtimeDefault").findings.length);
  },
};

export const NoMatch: Story = {
  args: { search: { severity: recordedSeverity("codeNoMatch") } },
  decorators: seeded({ code: "codeNoMatch", runtime: "runtimeNoMatch" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Each recording answers state "data" with total 0: a filter matched no finding.
    recordedEmpty("codeNoMatch");
    recordedEmpty("runtimeNoMatch");
    for (const title of [CODE_TITLE, RUNTIME_TITLE]) {
      const list = card(canvas, title);
      await expect(await list.findByText(NO_MATCH)).toBeVisible();
      await expect(list.queryByRole("table")).not.toBeInTheDocument();
      await expect(list.queryByText("No scan data")).not.toBeInTheDocument();
      await expect(list.queryByText(/No active findings/)).not.toBeInTheDocument();
      await expect(list.queryByText("Rows per page:")).not.toBeInTheDocument();
    }
  },
};

export const CodeSecondPageSynthetic: Story = {
  args: { search: { codePage: 2 } },
  decorators: seededWith(syntheticCodeSecondPage()),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const code = card(canvas, CODE_TITLE);
    const runtime = card(canvas, RUNTIME_TITLE);

    await expect(bodyRows(await findingsTable(code, CODE_TITLE))).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    await expect(
      code.getByText(
        `${PLATFORM_LIST_DEFAULT_PAGE_SIZE + 1}-${2 * PLATFORM_LIST_DEFAULT_PAGE_SIZE} of ${SYNTHETIC_CODE_TOTAL}`
      )
    ).toBeVisible();
    await expect(runtime.getByRole("button", { name: "Next page" })).toBeDisabled();

    // Each list pages on its own; a filter starts both at their first page again.
    await userEvent.click(code.getByRole("button", { name: "Next page" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ codePage: 3 });
    await userEvent.click(code.getByRole("button", { name: "Previous page" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ codePage: 1 });
    await userEvent.click(group(canvas, "Severity").getByRole("button", { name: "Critical" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({
      severity: "Critical",
      codePage: undefined,
      runtimePage: undefined,
    });
  },
};

export const RuntimeTriagedTruncatedSynthetic: Story = {
  args: { search: { state: "falsePositive" } },
  decorators: seededWith(syntheticTruncatedTriaged()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = card(canvas, RUNTIME_TITLE);

    await expect(
      runtime.getByText(
        `The list holds the ${SYNTHETIC_TRIAGED_TOTAL} most severe findings of this state; DefectDojo has more.`
      )
    ).toBeVisible();
    await expect(bodyRows(await findingsTable(runtime, RUNTIME_TITLE))).toHaveLength(PLATFORM_LIST_DEFAULT_PAGE_SIZE);
    await expect(runtime.getByText(`1-${PLATFORM_LIST_DEFAULT_PAGE_SIZE} of ${SYNTHETIC_TRIAGED_TOTAL}`)).toBeVisible();
    await expect(runtime.getByRole("button", { name: "Next page" })).toBeEnabled();
    await expect(card(canvas, CODE_TITLE).queryByText(/The list holds the/)).not.toBeInTheDocument();
  },
};

export const CodeNoActiveFindings: Story = {
  args: { search: { codebase: recordedCodebase("codeNoActive") } },
  decorators: seeded({ code: "codeNoActive", runtime: "runtimeDefault" }),
  play: async ({ canvasElement }) => {
    const code = card(within(canvasElement), CODE_TITLE);

    // The codebase has Gitleaks scans and none of their findings is active.
    recordedEmpty("codeNoActive");
    await expect(await code.findByText("No active findings.")).toBeVisible();
    await expect(code.queryByText(NO_MATCH)).not.toBeInTheDocument();
    await expect(code.queryByText("No scan data")).not.toBeInTheDocument();
    await expect(code.queryByRole("table")).not.toBeInTheDocument();
  },
};

export const RuntimeNoActiveFindingsSynthetic: Story = {
  decorators: seededWith(syntheticRuntimeNoActiveFindings()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = card(canvas, RUNTIME_TITLE);

    await expect(await runtime.findByText("No active findings.")).toBeVisible();
    await expect(runtime.queryByText(NO_MATCH)).not.toBeInTheDocument();
    await expect(runtime.queryByRole("table")).not.toBeInTheDocument();
    await expect(bodyRows(await findingsTable(card(canvas, CODE_TITLE), CODE_TITLE))).toHaveLength(
      recordedData("codeDefault").findings.length
    );
  },
};

export const NotConfigured: Story = {
  decorators: seededWith(recordedUnavailable("notConfigured")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both lists read one DefectDojo: the page says so once, in place of the cards.
    await expect(await canvas.findByText("DefectDojo is not connected")).toBeVisible();
    await expect(canvas.getAllByText("DefectDojo is not connected")).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: /Learn more/ })).toHaveAttribute(
      "href",
      expect.stringContaining("defectdojo")
    );
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    for (const title of [CODE_TITLE, RUNTIME_TITLE]) {
      await expect(canvas.queryByRole("heading", { name: title })).not.toBeInTheDocument();
    }
    await expect(canvas.queryByRole("group", { name: "Running workloads" })).not.toBeInTheDocument();
    await expect(group(canvas, "Finding state").getByRole("button", { name: "Active" })).toBeEnabled();
  },
};

export const Unreachable: Story = {
  decorators: seededWith(recordedUnavailable("unreachable")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alerts = await canvas.findAllByRole("alert");
    await expect(alerts).toHaveLength(1);
    const alert = within(alerts[0]);
    await expect(alert.getByText("DefectDojo is unreachable")).toBeVisible();
    await expect(alert.getByText("Exposed secrets cannot be loaded.")).toBeVisible();
    // The page asks again on mount, as it does after an outage; the button is off while it does.
    await waitFor(() => expect(alert.getByRole("button", { name: "Retry" })).toBeEnabled());
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(alerts[0]).not.toHaveTextContent(/https?:|token/i);
  },
};

export const KubernetesReadFailed: Story = {
  decorators: [withFailingTrpc(FORBIDDEN_MESSAGE), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Each card fails on its own: the answer is not a DefectDojo state.
    for (const title of [CODE_TITLE, RUNTIME_TITLE]) {
      const alert = within(await card(canvas, title).findByRole("alert"));
      await expect(alert.getByText("Failed to load security findings")).toBeVisible();
      await expect(alert.getByText(FORBIDDEN_MESSAGE)).toBeVisible();
      await waitFor(() => expect(alert.getByRole("button", { name: "Retry" })).toBeEnabled());
    }
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
  },
};
