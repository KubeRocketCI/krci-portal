// Data: answers of both procedures recorded on the testbed (see ../../__fixtures__/seed.ts), seeded under the keys the
// page reads; state Active unless a story says otherwise. The stories whose names end in Synthetic use data derived
// from the recording (see ../../__fixtures__/synthetic.ts): the testbed lacks those states.
// The recording, Runtime: both clusters are Stage clusters, so both are in view by default. in-cluster holds the
// Environments demo / shadow (namespace krci-other-dev, not managed), demo / dev (krci-demo-dev, managed) and demo / qa
// (krci-demo-qa, managed), and argocd, krci and krci-security, which have no Environment and are not managed. All six
// have a namespace product and an Active finding, and Active exposed secrets are in krci-demo-dev only. remote-cluster
// holds demo / prod (krci-demo-prod), which has no namespace product. Under False positive, krci-demo-qa has no
// finding.
// The recording, Codebases: krci-gitops has the Code scans Semgrep JSON Report and Gitleaks Scan and a Trivy Scan of
// its own image. test-go-app has the same Code scans, a Trivy Scan and an Anchore Grype of its own image, and a Trivy
// Scan of busybox, a third-party image. Both have a Codebase, and no Codebase is without a scan. Active Critical
// findings are in the two scans of the own image of test-go-app; under Mitigated, only its Trivy Scan of the own image
// has findings.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DEFECTDOJO_SEVERITIES, type DefectDojoLevel, type SeverityCounts } from "@my-project/shared";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { withAppProviders, withFailingTrpc, withPendingTrpc } from "@sb/index";
import { RUNTIME_WITHOUT_MITIGATED_NOTE } from "@/modules/platform/security/components/defectdojo/constants";
import {
  FORBIDDEN_MESSAGE,
  bodyRows,
  buttonLabels,
  codebasePath,
  group,
  stagePath,
} from "@/modules/platform/security/components/defectdojo/__fixtures__/plays";
import { SecurityOverview } from ".";
import {
  OVERVIEW_NAMESPACE,
  recordedAnswers,
  recordedOutage,
  seedOverview,
  type OverviewAnswers,
} from "../../__fixtures__/seed";
import {
  NO_RUNTIME_SCAN_DATA,
  counts,
  syntheticBusyCodebases,
  syntheticCodebasesWithoutImageOwner,
  syntheticManagedRuntime,
  syntheticNoScanDataCodebases,
  syntheticUnknownAndUnscannedCodebases,
} from "../../__fixtures__/synthetic";

const meta = {
  title: "Platform/Security/Overview",
  component: SecurityOverview,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { search: {}, onSearchChange: fn(), namespace: OVERVIEW_NAMESPACE, clusterName: "in-cluster" },
} satisfies Meta<typeof SecurityOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

type Scope = ReturnType<typeof within>;

const IN_CLUSTER_BUTTON = "in-cluster (this installation)";
const REMOTE_CLUSTER_BUTTON = "remote-cluster (this installation)";

const NAMESPACES_TABLE = "Namespaces of cluster in-cluster";
const REMOTE_NAMESPACES_TABLE = "Namespaces of cluster remote-cluster";
const CODEBASES_TABLE = "Code and Image scans by codebase";

const TOP_NAMESPACES = "Namespaces with the most findings";
const TOP_CODEBASES = "Codebases with the most findings";

const NO_CODEBASE_SCAN_DATA =
  "The CI security scan has not reported Code and Image findings for the codebases of this installation.";

const VULNERABILITIES_PATH = "/c/in-cluster/security/trivy/vulnerabilities";
const EXPOSED_SECRETS_PATH = "/c/in-cluster/security/container/exposed-secrets";

const GITOPS_IMAGE_TARGET = "Branch main, gitlab.127.0.0.1.nip.io:5050/krci/krci-gitops:main-20261123-091500";
const TEST_GO_APP_IMAGE_TARGET = "Branch main, gitlab.127.0.0.1.nip.io:5050/krci/test-go-app:main-20261123-090000";

const seeded = (answers: OverviewAnswers) => [withAppProviders({ seedQueryCache: seedOverview(answers) })];

const levelCard = async (canvas: Scope, level: DefectDojoLevel): Promise<Scope> =>
  within(await canvas.findByTestId(`level-card-${level}`));

const topCard = async (canvas: Scope, id: "top-namespaces" | "top-codebases"): Promise<Scope> =>
  within(await canvas.findByTestId(id));

/** The line of a level card; its name must occur once in the card. */
function cardLine(card: Scope, name: string): Scope {
  const line = card.getByText(name).closest("[data-testid='card-line']");
  if (!line) {
    throw new Error(`No line of ${name}`);
  }
  return within(line);
}

/** The row of a table; the text must occur once in the table. */
function rowOf(table: Scope, text: string): Scope {
  const row = table.getByText(text).closest("tr");
  if (!row) {
    throw new Error(`No row of ${text}`);
  }
  return within(row);
}

const tableOf = async (canvas: Scope, name: string): Promise<Scope> =>
  within(await canvas.findByRole("table", { name }));

const linkUrl = (link: HTMLElement): URL => new URL(link.getAttribute("href") ?? "", "http://localhost");

/** The path of a link and the search values that are plain strings. */
async function expectLink(link: HTMLElement, path: string, search: Record<string, string> = {}): Promise<void> {
  const url = linkUrl(link);
  await expect(url.pathname).toBe(path);
  for (const [key, value] of Object.entries(search)) {
    await expect(url.searchParams.get(key)).toBe(value);
  }
}

async function expectInOrder(...elements: HTMLElement[]): Promise<void> {
  for (let index = 1; index < elements.length; index++) {
    await expect(
      elements[index - 1].compareDocumentPosition(elements[index]) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  }
}

/** A count of each severity, named as the severity count badges name them. */
async function expectCounts(scope: Scope, expected: SeverityCounts): Promise<void> {
  for (const severity of DEFECTDOJO_SEVERITIES) {
    await expect(scope.getByRole("img", { name: `${severity}: ${expected[severity]}` })).toBeVisible();
  }
}

interface ExpectedLine {
  name: string;
  detail: string;
  /** `null`: the line adds up no finding, and says so. */
  counts: SeverityCounts | null;
}

async function expectLines(card: Scope, lines: ExpectedLine[]): Promise<void> {
  await expect(card.getAllByTestId("card-line")).toHaveLength(lines.length);
  for (const { name, detail, counts: expected } of lines) {
    const line = cardLine(card, name);
    await expect(line.getByText(detail)).toBeVisible();
    if (expected === null) {
      await expect(line.getByText("No findings")).toBeVisible();
    } else {
      await expectCounts(group(line, name), expected);
    }
  }
}

const listItems = (canvas: Scope, name: string): HTMLElement[] =>
  within(canvas.getByRole("list", { name })).getAllByRole("listitem");

const ariaLabels = (elements: HTMLElement[]): (string | null)[] =>
  elements.map((element) => element.getAttribute("aria-label"));

/** The accessible name of the one link of each item that matches `link`. */
const linkNames = (items: HTMLElement[], link: RegExp): (string | null)[] =>
  ariaLabels(items.map((item) => within(item).getByRole("link", { name: link })));

async function expectPressed(scope: Scope, name: string, pressed: boolean): Promise<void> {
  await expect(scope.getByRole("button", { name })).toHaveAttribute("aria-pressed", String(pressed));
}

/** Opens the select and lists its options as the user reads them. */
async function openSelect(canvasElement: HTMLElement, name: string): Promise<Scope> {
  await userEvent.click(within(canvasElement).getByRole("combobox", { name }));
  return within(await within(canvasElement.ownerDocument.body).findByRole("listbox"));
}

const optionLabels = (options: Scope): (string | null)[] =>
  options.getAllByRole("option").map((option: HTMLElement) => option.textContent);

export const Data: Story = {
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");
    const image = await levelCard(canvas, "image");
    const code = await levelCard(canvas, "code");

    await step("Filters", async () => {
      const level = group(canvas, "Level");
      await expect(buttonLabels(level)).toEqual(["All", "Runtime", "Image", "Code"]);
      await expectPressed(level, "All", true);

      const clusters = group(canvas, "Clusters");
      for (const name of [IN_CLUSTER_BUTTON, REMOTE_CLUSTER_BUTTON]) {
        await expectPressed(clusters, name, true);
        await expect(clusters.getByRole("button", { name })).toBeEnabled();
      }
      await expect(canvas.getByRole("combobox", { name: "Namespace" })).toHaveTextContent("All namespaces");
      await expect(canvas.getByRole("combobox", { name: "Environment" })).toHaveTextContent("All Environments");
      await expect(canvas.getByRole("combobox", { name: "Codebase" })).toHaveTextContent("All codebases");
      await expectPressed(group(canvas, "Severity"), "All", true);

      const states = group(canvas, "Finding state");
      await expect(buttonLabels(states)).toEqual([
        "Active",
        "Mitigated",
        "False positive",
        "Out of scope",
        "Risk accepted",
      ]);
      await expectPressed(states, "Active", true);
    });

    await step("Runtime card", async () => {
      await expect(runtime.getByRole("heading", { name: "Runtime" })).toBeVisible();
      await expectLines(runtime, [
        {
          name: "Vulnerabilities",
          detail: "Trivy Operator Scan, 6 namespaces",
          counts: counts({ Critical: 29, High: 224, Medium: 16, Low: 11, Info: 642 }),
        },
        {
          name: "Exposed secrets",
          detail: "Trivy Operator Scan, 6 namespaces",
          counts: counts({ High: 1, Medium: 1 }),
        },
      ]);

      const vulnerabilities = runtime.getByRole("link", { name: "Runtime vulnerabilities" });
      await expectLink(vulnerabilities, VULNERABILITIES_PATH, { level: "runtime" });
      await expect(linkUrl(vulnerabilities).searchParams.get("cluster")).toContain("remote-cluster");
      await expectLink(runtime.getByRole("link", { name: "Runtime exposed secrets" }), EXPOSED_SECRETS_PATH);
    });

    await step("Image card", async () => {
      await expectLines(image, [
        { name: "Trivy Scan", detail: "3 scans", counts: counts({ Critical: 1, High: 4, Medium: 2, Low: 1 }) },
        { name: "Anchore Grype", detail: "1 scan", counts: counts({ Critical: 1, High: 1, Medium: 1 }) },
      ]);
      for (const scanner of ["Trivy Scan", "Anchore Grype"]) {
        await expectLink(
          cardLine(image, scanner).getByRole("link", { name: `Image vulnerabilities (${scanner})` }),
          VULNERABILITIES_PATH,
          { level: "image" }
        );
      }
    });

    await step("Code card", async () => {
      await expectLines(code, [
        { name: "Semgrep JSON Report", detail: "2 scans", counts: counts({ High: 1, Low: 1 }) },
        { name: "Gitleaks Scan", detail: "2 scans", counts: counts({ High: 1 }) },
      ]);
      await expectLink(
        cardLine(code, "Semgrep JSON Report").getByRole("link", { name: "Code vulnerabilities (Semgrep JSON Report)" }),
        VULNERABILITIES_PATH,
        { level: "code" }
      );
      // A secret scan opens the Exposed Secrets list, not Vulnerabilities.
      await expectLink(
        cardLine(code, "Gitleaks Scan").getByRole("link", { name: "Code exposed secrets (Gitleaks Scan)" }),
        EXPOSED_SECRETS_PATH
      );
    });

    await step("Where to start", async () => {
      const namespaces = await topCard(canvas, "top-namespaces");
      const items = listItems(namespaces, TOP_NAMESPACES);
      await expect(linkNames(items, /^Vulnerabilities of /)).toEqual([
        "Vulnerabilities of in-cluster / argocd",
        "Vulnerabilities of in-cluster / krci-other-dev",
        "Vulnerabilities of in-cluster / krci-demo-dev",
        "Vulnerabilities of in-cluster / krci-demo-qa",
        "Vulnerabilities of in-cluster / krci",
      ]);
      await expect(within(items[0]).queryByText("Managed")).not.toBeInTheDocument();
      await expect(within(items[0]).queryByRole("link", { name: /^Environment / })).not.toBeInTheDocument();
      await expectLink(
        within(items[1]).getByRole("link", { name: "Environment demo / shadow" }),
        stagePath(OVERVIEW_NAMESPACE, "demo", "shadow")
      );
      await expectLink(
        within(items[2]).getByRole("link", { name: "Environment demo / dev" }),
        stagePath(OVERVIEW_NAMESPACE, "demo", "dev")
      );

      const codebases = await topCard(canvas, "top-codebases");
      const entries = listItems(codebases, TOP_CODEBASES);
      await expect(linkNames(entries, /^Findings of /)).toEqual(["Findings of test-go-app", "Findings of krci-gitops"]);
      // A codebase ranks by its most severe scan, which it shows.
      await expect(within(entries[0]).getByText(`Trivy Scan, ${TEST_GO_APP_IMAGE_TARGET}`)).toBeVisible();
      await expectCounts(
        group(within(entries[0]), "Trivy Scan of test-go-app"),
        counts({ Critical: 1, High: 2, Medium: 1 })
      );
      await expect(within(entries[1]).getByText(`Trivy Scan, ${GITOPS_IMAGE_TARGET}`)).toBeVisible();
      await expectLink(
        within(entries[0]).getByRole("link", { name: "Security findings of test-go-app" }),
        codebasePath(OVERVIEW_NAMESPACE, "test-go-app"),
        { tab: "findings" }
      );
    });

    await step("Namespaces tab", async () => {
      const inCluster = await tableOf(canvas, NAMESPACES_TABLE);
      const remote = await tableOf(canvas, REMOTE_NAMESPACES_TABLE);
      await expectInOrder(
        canvas.getByRole("table", { name: NAMESPACES_TABLE }),
        canvas.getByRole("table", { name: REMOTE_NAMESPACES_TABLE })
      );

      await expect(bodyRows(inCluster)).toHaveLength(8);
      await expectInOrder(
        inCluster.getByText("Environments and managed namespaces (3)"),
        inCluster.getByText("krci-other-dev"),
        inCluster.getByText("krci-demo-dev"),
        inCluster.getByText("krci-demo-qa"),
        inCluster.getByText("Other namespaces (3)"),
        inCluster.getByText("argocd"),
        inCluster.getByText("krci"),
        inCluster.getByText("krci-security")
      );

      const dev = rowOf(inCluster, "krci-demo-dev");
      await expectCounts(dev, counts({ Critical: 4, High: 4, Medium: 7, Low: 2 }));
      await expect(dev.queryByText("Managed")).not.toBeInTheDocument();
      await expectLink(
        dev.getByRole("link", { name: "Environment demo / dev" }),
        stagePath(OVERVIEW_NAMESPACE, "demo", "dev")
      );
      const devList = dev.getByRole("link", { name: "Vulnerabilities of in-cluster / krci-demo-dev" });
      await expectLink(devList, VULNERABILITIES_PATH, { level: "runtime", namespace: "krci-demo-dev" });
      await expect(linkUrl(devList).searchParams.get("cluster")).toContain("in-cluster");
      const devSecrets = dev.getByRole("link", { name: "Exposed secrets of in-cluster / krci-demo-dev" });
      await expect(devSecrets).toHaveTextContent("2");
      await expectLink(devSecrets, EXPOSED_SECRETS_PATH, { namespace: "krci-demo-dev" });
      await expect(
        dev.getByRole("link", { name: "Product in-cluster / krci-demo-dev (opens DefectDojo in a new tab)" })
      ).toHaveAttribute("href", "https://defectdojo.example.test/asset/4");

      const qa = rowOf(inCluster, "krci-demo-qa");
      await expectCounts(qa, counts({ Critical: 1, High: 1 }));
      await expect(qa.getByRole("link", { name: "Environment demo / qa" })).toBeVisible();
      await expect(qa.queryByRole("link", { name: /^Exposed secrets of / })).not.toBeInTheDocument();

      const shadow = rowOf(inCluster, "krci-other-dev");
      await expectCounts(shadow, counts({ Critical: 9, High: 9, Medium: 9, Low: 9 }));
      await expect(shadow.getByRole("link", { name: "Environment demo / shadow" })).toBeVisible();
      await expect(shadow.queryByText("Managed")).not.toBeInTheDocument();

      const argocd = rowOf(inCluster, "argocd");
      await expectCounts(argocd, counts({ Critical: 15, High: 178, Info: 562 }));
      await expect(argocd.queryByText("Managed")).not.toBeInTheDocument();
      await expect(argocd.queryByRole("link", { name: /^Environment / })).not.toBeInTheDocument();

      await expectCounts(rowOf(inCluster, "krci"), counts({ High: 30, Info: 74 }));
      await expectCounts(rowOf(inCluster, "krci-security"), counts({ High: 2, Info: 6 }));

      // A Stage namespace without a namespace product: no counts, no lists.
      await expect(bodyRows(remote)).toHaveLength(2);
      await expect(remote.getByText("Environments and managed namespaces (1)")).toBeVisible();
      const prod = rowOf(remote, "krci-demo-prod");
      await expect(prod.getByText("No scan data")).toBeVisible();
      await expect(prod.getAllByRole("img", { name: /: no scan data$/ })).toHaveLength(DEFECTDOJO_SEVERITIES.length);
      await expectLink(
        prod.getByRole("link", { name: "Environment demo / prod" }),
        stagePath(OVERVIEW_NAMESPACE, "demo", "prod")
      );
      await expect(prod.queryByRole("link", { name: /^Vulnerabilities of / })).not.toBeInTheDocument();
      await expect(prod.queryByRole("link", { name: /^Product / })).not.toBeInTheDocument();

      await expect(canvas.queryByRole("table", { name: CODEBASES_TABLE })).not.toBeInTheDocument();
    });

    await step("Tabs", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Codebases" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({ tab: "codebases" });
    });
  },
};

interface ExpectedScanRow {
  level: "Code" | "Image";
  scanner: string;
  target: string;
  ownImage?: boolean;
  counts: SeverityCounts;
}

/** The rows of the Codebases tab in the order of the recording: the scans of krci-gitops, then those of test-go-app. */
const SCAN_ROWS: ExpectedScanRow[] = [
  { level: "Code", scanner: "Semgrep JSON Report", target: "Branch main", counts: counts({}) },
  { level: "Code", scanner: "Gitleaks Scan", target: "Branch main", counts: counts({}) },
  {
    level: "Image",
    scanner: "Trivy Scan",
    target: GITOPS_IMAGE_TARGET,
    ownImage: true,
    counts: counts({ High: 1, Low: 1 }),
  },
  { level: "Code", scanner: "Semgrep JSON Report", target: "Branch main", counts: counts({ High: 1, Low: 1 }) },
  { level: "Code", scanner: "Gitleaks Scan", target: "Branch main", counts: counts({ High: 1 }) },
  {
    level: "Image",
    scanner: "Trivy Scan",
    target: TEST_GO_APP_IMAGE_TARGET,
    ownImage: true,
    counts: counts({ Critical: 1, High: 2, Medium: 1 }),
  },
  {
    level: "Image",
    scanner: "Anchore Grype",
    target: TEST_GO_APP_IMAGE_TARGET,
    ownImage: true,
    counts: counts({ Critical: 1, High: 1, Medium: 1 }),
  },
  {
    level: "Image",
    scanner: "Trivy Scan",
    target: "Branch main, busybox",
    ownImage: false,
    counts: counts({ High: 1, Medium: 1 }),
  },
];

export const CodebasesTab: Story = {
  args: { search: { tab: "codebases" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const table = await tableOf(canvas, CODEBASES_TABLE);
    const rows = bodyRows(table);

    // A row per scan; no Codebase is without scan data.
    await expect(rows).toHaveLength(SCAN_ROWS.length);
    for (const [index, expected] of SCAN_ROWS.entries()) {
      const row = within(rows[index]);
      await expect(row.getByText(expected.level)).toBeVisible();
      await expect(row.getByText(expected.scanner)).toBeVisible();
      await expect(row.getByText(expected.target)).toBeVisible();
      if (expected.ownImage !== undefined) {
        await expect(row.getByText(expected.ownImage ? "Own image" : "Third-party image")).toBeVisible();
      }
      await expectCounts(row, expected.counts);
    }

    const links = table.getAllByRole("link", { name: /^Security findings of / });
    await expect(ariaLabels(links)).toEqual(["Security findings of krci-gitops", "Security findings of test-go-app"]);
    await expectInOrder(links[0], links[1]);
    await expectLink(links[0], codebasePath(OVERVIEW_NAMESPACE, "krci-gitops"), { tab: "findings" });
    await expectLink(links[1], codebasePath(OVERVIEW_NAMESPACE, "test-go-app"), { tab: "findings" });

    // The list a scan opens: Gitleaks the exposed secrets of the code, the other scanners the vulnerabilities of their
    // level.
    const semgrep = within(rows[3]);
    await expectLink(
      semgrep.getByRole("link", { name: "Semgrep JSON Report findings of test-go-app" }),
      VULNERABILITIES_PATH,
      { level: "code", codebase: "test-go-app" }
    );
    const gitleaks = within(rows[4]);
    await expectLink(
      gitleaks.getByRole("link", { name: "Gitleaks Scan findings of test-go-app" }),
      EXPOSED_SECRETS_PATH,
      { codebase: "test-go-app" }
    );
    await expect(
      gitleaks.getByRole("link", { name: "Test of Gitleaks Scan, test-go-app (opens DefectDojo in a new tab)" })
    ).toHaveAttribute("href", "https://defectdojo.example.test/test/49");
    await expectLink(
      within(rows[5]).getByRole("link", { name: "Trivy Scan findings of test-go-app" }),
      VULNERABILITIES_PATH,
      { level: "image", codebase: "test-go-app" }
    );

    await expect(canvas.queryByRole("table", { name: NAMESPACES_TABLE })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Namespaces" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ tab: "namespaces" });
  },
};

/** The recorded codebases, a codebase tag without a Codebase, and a Codebase without a scan. */
export const UnknownAndUnscannedCodebasesSynthetic: Story = {
  args: { search: { tab: "codebases" } },
  decorators: seeded({ ...recordedAnswers("active"), codebases: syntheticUnknownAndUnscannedCodebases() }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await tableOf(canvas, CODEBASES_TABLE);
    const rows = bodyRows(table);

    // A row per scan, then a row per Codebase without scan data: deleted-app, krci-gitops, test-go-app, idle-app.
    await expect(rows).toHaveLength(10);

    // A codebase tag without a Codebase: the name as text.
    const deleted = within(rows[0]);
    await expect(deleted.getByTitle("No Codebase of this name")).toHaveTextContent("deleted-app");
    await expect(deleted.queryByRole("link", { name: "Security findings of deleted-app" })).not.toBeInTheDocument();
    await expect(deleted.getByRole("link", { name: "Semgrep JSON Report findings of deleted-app" })).toBeVisible();
    await expectCounts(deleted, counts({ Critical: 1, Medium: 3 }));

    const links = table.getAllByRole("link", { name: /^Security findings of / });
    await expect(ariaLabels(links)).toEqual([
      "Security findings of krci-gitops",
      "Security findings of test-go-app",
      "Security findings of idle-app",
    ]);
    await expectInOrder(table.getByText("deleted-app"), links[0], links[1], links[2]);

    // A Codebase without a CI test: named, without counts and lists.
    const idle = within(rows[9]);
    await expect(idle.getByText("No scan data")).toBeVisible();
    await expect(idle.getAllByRole("img", { name: /: no scan data$/ })).toHaveLength(DEFECTDOJO_SEVERITIES.length);
    await expect(idle.getAllByRole("link")).toHaveLength(1);
    await expectLink(
      idle.getByRole("link", { name: "Security findings of idle-app" }),
      codebasePath(OVERVIEW_NAMESPACE, "idle-app"),
      { tab: "findings" }
    );
  },
};

/** A caller who may not list the CodebaseImageStreams: no image scan says whose image it is. */
export const ImageOwnerUnknownSynthetic: Story = {
  args: { search: { tab: "codebases" } },
  decorators: seeded({ ...recordedAnswers("active"), codebases: syntheticCodebasesWithoutImageOwner() }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await tableOf(canvas, CODEBASES_TABLE);

    await expect(bodyRows(table)).toHaveLength(SCAN_ROWS.length);
    await expect(table.getAllByText("Trivy Scan")).toHaveLength(3);
    await expect(table.queryByText("Own image")).not.toBeInTheDocument();
    await expect(table.queryByText("Third-party image")).not.toBeInTheDocument();
  },
};

export const LevelRuntime: Story = {
  args: { search: { level: "runtime" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await levelCard(canvas, "runtime");

    await expectPressed(group(canvas, "Level"), "Runtime", true);
    for (const level of ["Image", "Code"]) {
      await expect(canvas.queryByRole("heading", { name: level })).not.toBeInTheDocument();
    }
    await expect(canvas.queryByTestId("level-card-image")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("level-card-code")).not.toBeInTheDocument();

    await expect(canvas.getByRole("list", { name: TOP_NAMESPACES })).toBeVisible();
    await expect(canvas.queryByRole("list", { name: TOP_CODEBASES })).not.toBeInTheDocument();

    await expect(canvas.getByRole("button", { name: "Namespaces" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Codebases" })).not.toBeInTheDocument();
    await expect(await canvas.findByRole("table", { name: NAMESPACES_TABLE })).toBeVisible();

    // The codebase filter narrows Code and Image only.
    await expect(canvas.getByRole("group", { name: "Clusters" })).toBeVisible();
    await expect(canvas.queryByRole("combobox", { name: "Codebase" })).not.toBeInTheDocument();

    await userEvent.click(group(canvas, "Level").getByRole("button", { name: "All" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ level: undefined });
  },
};

export const LevelCode: Story = {
  args: { search: { level: "code" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const code = await levelCard(canvas, "code");

    await expectPressed(group(canvas, "Level"), "Code", true);
    await expect(canvas.queryByTestId("level-card-runtime")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("level-card-image")).not.toBeInTheDocument();
    await expectLines(code, [
      { name: "Semgrep JSON Report", detail: "2 scans", counts: counts({ High: 1, Low: 1 }) },
      { name: "Gitleaks Scan", detail: "2 scans", counts: counts({ High: 1 }) },
    ]);

    // krci-gitops has no Code finding, so it is not among the codebases with the most findings.
    await expect(canvas.queryByRole("list", { name: TOP_NAMESPACES })).not.toBeInTheDocument();
    const entries = listItems(canvas, TOP_CODEBASES);
    await expect(linkNames(entries, /^Findings of /)).toEqual(["Findings of test-go-app"]);
    await expect(within(entries[0]).getByText("Semgrep JSON Report, Branch main")).toBeVisible();

    // Only the Codebases tab, with the Code scans.
    await expect(canvas.queryByRole("button", { name: "Namespaces" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("table", { name: NAMESPACES_TABLE })).not.toBeInTheDocument();
    const table = await tableOf(canvas, CODEBASES_TABLE);
    await expect(bodyRows(table)).toHaveLength(4);
    await expect(table.queryByText("Image")).not.toBeInTheDocument();
    await expect(table.getAllByText("Code")).toHaveLength(4);
    await expect(table.queryByText("No scan data")).not.toBeInTheDocument();

    await expect(canvas.queryByRole("group", { name: "Clusters" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("combobox", { name: "Codebase" })).toBeVisible();

    await userEvent.click(group(canvas, "Level").getByRole("button", { name: "Image" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ level: "image" });
  },
};

export const SeverityFilter: Story = {
  args: { search: { severity: "Critical" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");
    const image = await levelCard(canvas, "image");
    const code = await levelCard(canvas, "code");

    const severity = group(canvas, "Severity");
    await expectPressed(severity, "Critical", true);
    await expectPressed(severity, "All", false);

    // The namespaces with no Critical finding are hidden, a namespace without a product too, and so is its cluster.
    const inCluster = await tableOf(canvas, NAMESPACES_TABLE);
    await expect(bodyRows(inCluster)).toHaveLength(6);
    await expectInOrder(
      inCluster.getByText("Environments and managed namespaces (3)"),
      inCluster.getByText("krci-other-dev"),
      inCluster.getByText("krci-demo-dev"),
      inCluster.getByText("krci-demo-qa"),
      inCluster.getByText("Other namespaces (1)"),
      inCluster.getByText("argocd")
    );
    for (const hidden of ["krci", "krci-security"]) {
      await expect(inCluster.queryByText(hidden)).not.toBeInTheDocument();
    }
    await expect(canvas.queryByRole("table", { name: REMOTE_NAMESPACES_TABLE })).not.toBeInTheDocument();
    await expect(canvas.queryByText("krci-demo-prod")).not.toBeInTheDocument();
    await expectLink(
      rowOf(inCluster, "krci-demo-dev").getByRole("link", { name: "Vulnerabilities of in-cluster / krci-demo-dev" }),
      VULNERABILITIES_PATH,
      { severity: "Critical" }
    );

    // The most Critical findings first.
    await expect(linkNames(listItems(canvas, TOP_NAMESPACES), /^Vulnerabilities of /)).toEqual([
      "Vulnerabilities of in-cluster / argocd",
      "Vulnerabilities of in-cluster / krci-other-dev",
      "Vulnerabilities of in-cluster / krci-demo-dev",
      "Vulnerabilities of in-cluster / krci-demo-qa",
    ]);
    await expect(linkNames(listItems(canvas, TOP_CODEBASES), /^Findings of /)).toEqual(["Findings of test-go-app"]);

    // The lines add up the namespaces and the scans that stay.
    await expectLines(runtime, [
      {
        name: "Vulnerabilities",
        detail: "Trivy Operator Scan, 4 namespaces",
        counts: counts({ Critical: 29, High: 192, Medium: 16, Low: 11, Info: 562 }),
      },
      {
        name: "Exposed secrets",
        detail: "Trivy Operator Scan, 4 namespaces",
        counts: counts({ High: 1, Medium: 1 }),
      },
    ]);
    await expectLines(image, [
      { name: "Trivy Scan", detail: "1 scan", counts: counts({ Critical: 1, High: 2, Medium: 1 }) },
      { name: "Anchore Grype", detail: "1 scan", counts: counts({ Critical: 1, High: 1, Medium: 1 }) },
    ]);
    // The Code scans are in the part, and none has a Critical finding.
    await expect(code.getByText("No scan matches the filters.")).toBeVisible();
    await expect(code.queryByTestId("card-line")).not.toBeInTheDocument();

    await userEvent.click(severity.getByRole("button", { name: "Critical" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ severity: undefined });
  },
};

export const SeverityFilterCodebasesTab: Story = {
  args: { search: { severity: "Critical", tab: "codebases" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await tableOf(canvas, CODEBASES_TABLE);

    // The scans with a Critical finding stay: the two of the own image of test-go-app.
    const rows = bodyRows(table);
    await expect(rows).toHaveLength(2);
    await expectCounts(within(rows[0]), counts({ Critical: 1, High: 2, Medium: 1 }));
    await expectCounts(within(rows[1]), counts({ Critical: 1, High: 1, Medium: 1 }));
    await expect(ariaLabels(table.getAllByRole("link", { name: /^Security findings of / }))).toEqual([
      "Security findings of test-go-app",
    ]);
    await expect(table.getAllByText("Image")).toHaveLength(2);
    for (const hidden of ["Semgrep JSON Report", "Gitleaks Scan", "krci-gitops"]) {
      await expect(table.queryByText(hidden)).not.toBeInTheDocument();
    }
  },
};

export const NamespaceAndEnvironment: Story = {
  args: { search: { namespace: "krci-demo-qa", cdPipeline: "demo", stage: "qa" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");
    const table = await tableOf(canvas, NAMESPACES_TABLE);

    await expect(canvas.getByRole("combobox", { name: "Namespace" })).toHaveTextContent("krci-demo-qa (demo / qa)");
    await expect(canvas.getByRole("combobox", { name: "Environment" })).toHaveTextContent(
      "demo / qa (in-cluster / krci-demo-qa)"
    );

    // The Namespaces tab and the Runtime card narrow to the namespace; the other cluster has no row left.
    await expect(bodyRows(table)).toHaveLength(2);
    await expect(table.getByText("krci-demo-qa")).toBeVisible();
    for (const hidden of ["krci-other-dev", "krci-demo-dev", "argocd", "krci", "krci-security"]) {
      await expect(table.queryByText(hidden)).not.toBeInTheDocument();
    }
    await expect(canvas.queryByRole("table", { name: REMOTE_NAMESPACES_TABLE })).not.toBeInTheDocument();
    await expectLines(runtime, [
      {
        name: "Vulnerabilities",
        detail: "Trivy Operator Scan, 1 namespace",
        counts: counts({ Critical: 1, High: 1 }),
      },
      { name: "Exposed secrets", detail: "Trivy Operator Scan, 1 namespace", counts: null },
    ]);
    await expectLink(runtime.getByRole("link", { name: "Runtime vulnerabilities" }), VULNERABILITIES_PATH, {
      level: "runtime",
      namespace: "krci-demo-qa",
    });

    await step("Namespace", async () => {
      const options = await openSelect(canvasElement, "Namespace");
      await expect(optionLabels(options)).toEqual([
        "All namespaces",
        "argocd",
        "krci",
        "krci-demo-dev (demo / dev)",
        "krci-demo-prod (demo / prod)",
        "krci-demo-qa (demo / qa)",
        "krci-other-dev (demo / shadow)",
        "krci-security",
      ]);
      await userEvent.click(options.getByRole("option", { name: "krci-demo-dev (demo / dev)" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({
        namespace: "krci-demo-dev",
        cdPipeline: "demo",
        stage: "qa",
      });
    });

    await step("Environment", async () => {
      const options = await openSelect(canvasElement, "Environment");
      await expect(optionLabels(options)).toEqual([
        "All Environments",
        "demo / dev (in-cluster / krci-demo-dev)",
        "demo / prod (remote-cluster / krci-demo-prod)",
        "demo / qa (in-cluster / krci-demo-qa)",
        "demo / shadow (in-cluster / krci-other-dev)",
      ]);
      await userEvent.click(options.getByRole("option", { name: "demo / dev (in-cluster / krci-demo-dev)" }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({
        namespace: "krci-demo-qa",
        cdPipeline: "demo",
        stage: "dev",
      });
    });

    await step("Clusters", async () => {
      await userEvent.click(group(canvas, "Clusters").getByRole("button", { name: REMOTE_CLUSTER_BUTTON }));
      await expect(args.onSearchChange).toHaveBeenLastCalledWith({
        cluster: ["in-cluster"],
        namespace: undefined,
        cdPipeline: undefined,
        stage: undefined,
      });
    });
  },
};

/** A namespace the installation manages without a Stage: named so, in the first group of its cluster. */
export const ManagedNamespaceWithoutStageSynthetic: Story = {
  decorators: seeded({ ...recordedAnswers("active"), runtime: syntheticManagedRuntime() }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inCluster = await tableOf(canvas, NAMESPACES_TABLE);

    await expect(bodyRows(inCluster)).toHaveLength(8);
    await expectInOrder(
      inCluster.getByText("Environments and managed namespaces (4)"),
      inCluster.getByText("krci-other-dev"),
      inCluster.getByText("krci-demo-dev"),
      inCluster.getByText("krci-demo-qa"),
      inCluster.getByText("krci"),
      inCluster.getByText("Other namespaces (2)"),
      inCluster.getByText("argocd"),
      inCluster.getByText("krci-security")
    );

    const managed = rowOf(inCluster, "krci");
    await expect(managed.getByText("Managed")).toBeVisible();
    await expect(managed.queryByRole("link", { name: /^Environment / })).not.toBeInTheDocument();
    await expectCounts(managed, counts({ High: 30, Info: 74 }));
  },
};

export const CodebaseFilter: Story = {
  args: { search: { codebase: "test-go-app", tab: "codebases" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");
    const image = await levelCard(canvas, "image");
    const code = await levelCard(canvas, "code");

    await expect(canvas.getByRole("combobox", { name: "Codebase" })).toHaveTextContent("test-go-app");

    // The Codebases tab keeps the scans of the codebase.
    const table = await tableOf(canvas, CODEBASES_TABLE);
    await expect(bodyRows(table)).toHaveLength(5);
    await expect(table.queryByText("krci-gitops")).not.toBeInTheDocument();

    await expectLines(image, [
      { name: "Trivy Scan", detail: "2 scans", counts: counts({ Critical: 1, High: 3, Medium: 2 }) },
      { name: "Anchore Grype", detail: "1 scan", counts: counts({ Critical: 1, High: 1, Medium: 1 }) },
    ]);
    await expectLines(code, [
      { name: "Semgrep JSON Report", detail: "1 scan", counts: counts({ High: 1, Low: 1 }) },
      { name: "Gitleaks Scan", detail: "1 scan", counts: counts({ High: 1 }) },
    ]);
    await expectLink(
      cardLine(code, "Gitleaks Scan").getByRole("link", { name: "Code exposed secrets (Gitleaks Scan)" }),
      EXPOSED_SECRETS_PATH,
      { codebase: "test-go-app" }
    );
    await expect(linkNames(listItems(canvas, TOP_CODEBASES), /^Findings of /)).toEqual(["Findings of test-go-app"]);

    // The Runtime card does not read the codebase.
    await expect(runtime.getAllByText("Trivy Operator Scan, 6 namespaces")).toHaveLength(2);

    const options = await openSelect(canvasElement, "Codebase");
    await expect(optionLabels(options)).toEqual(["All codebases", "krci-gitops", "test-go-app"]);
    await userEvent.click(options.getByRole("option", { name: "krci-gitops" }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith({ codebase: "krci-gitops", tab: "codebases" });
  },
};

export const WhereToStartNamespaceLimit: Story = {
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const namespaces = await topCard(canvas, "top-namespaces");

    // Six namespaces have findings, krci-security among them; the list holds the five most severe.
    const inCluster = await tableOf(canvas, NAMESPACES_TABLE);
    await expectCounts(rowOf(inCluster, "krci-security"), counts({ High: 2, Info: 6 }));
    await expect(linkNames(listItems(namespaces, TOP_NAMESPACES), /^Vulnerabilities of /)).toEqual([
      "Vulnerabilities of in-cluster / argocd",
      "Vulnerabilities of in-cluster / krci-other-dev",
      "Vulnerabilities of in-cluster / krci-demo-dev",
      "Vulnerabilities of in-cluster / krci-demo-qa",
      "Vulnerabilities of in-cluster / krci",
    ]);
    await expect(
      namespaces.queryByRole("link", { name: "Vulnerabilities of in-cluster / krci-security" })
    ).not.toBeInTheDocument();
  },
};

/** service-1 to service-6 each have a Critical finding, more than any recorded codebase. */
export const WhereToStartCodebaseLimitSynthetic: Story = {
  decorators: seeded({ ...recordedAnswers("active"), codebases: syntheticBusyCodebases() }),
  play: async ({ canvasElement }) => {
    const codebases = await topCard(within(canvasElement), "top-codebases");

    // The list holds the five most severe: service-6, and the recorded codebases, are past it.
    await expect(linkNames(listItems(codebases, TOP_CODEBASES), /^Findings of /)).toEqual([
      "Findings of service-1",
      "Findings of service-2",
      "Findings of service-3",
      "Findings of service-4",
      "Findings of service-5",
    ]);
    for (const left of ["service-6", "test-go-app", "krci-gitops"]) {
      await expect(codebases.queryByRole("link", { name: `Findings of ${left}` })).not.toBeInTheDocument();
    }
  },
};

export const FalsePositive: Story = {
  args: { search: { state: "falsePositive" } },
  decorators: seeded(recordedAnswers("falsePositive")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");
    const image = await levelCard(canvas, "image");
    const code = await levelCard(canvas, "code");

    await expectPressed(group(canvas, "Finding state"), "False positive", true);

    await expectLines(runtime, [
      { name: "Vulnerabilities", detail: "Trivy Operator Scan, 6 namespaces", counts: counts({ High: 1 }) },
      { name: "Exposed secrets", detail: "Trivy Operator Scan, 6 namespaces", counts: counts({ High: 1 }) },
    ]);
    // A scan type whose scans hold no finding of the state says so.
    await expectLines(image, [
      { name: "Trivy Scan", detail: "3 scans", counts: null },
      { name: "Anchore Grype", detail: "1 scan", counts: null },
    ]);
    await expectLines(code, [
      { name: "Semgrep JSON Report", detail: "2 scans", counts: counts({ Medium: 1 }) },
      { name: "Gitleaks Scan", detail: "2 scans", counts: counts({ High: 1 }) },
    ]);

    // A namespace with a namespace product and no finding of the state says so, with zero counts.
    const qa = rowOf(await tableOf(canvas, NAMESPACES_TABLE), "krci-demo-qa");
    await expect(qa.getByText("No findings")).toBeVisible();
    await expectCounts(qa, counts({}));

    await expect(linkNames(listItems(canvas, TOP_NAMESPACES), /^Vulnerabilities of /)).toEqual([
      "Vulnerabilities of in-cluster / argocd",
      "Vulnerabilities of in-cluster / krci-demo-dev",
    ]);
    const entries = listItems(canvas, TOP_CODEBASES);
    await expect(linkNames(entries, /^Findings of /)).toEqual(["Findings of test-go-app"]);
    await expect(within(entries[0]).getByText("Gitleaks Scan, Branch main")).toBeVisible();
  },
};

export const Mitigated: Story = {
  args: { search: { state: "mitigated" } },
  decorators: seeded(recordedAnswers("mitigated")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");
    const image = await levelCard(canvas, "image");
    const code = await levelCard(canvas, "code");

    await expectPressed(group(canvas, "Finding state"), "Mitigated", true);

    // The Runtime card, the list of namespaces and the Namespaces tab say so; the page asks for no Runtime part.
    await expect(runtime.getByText(RUNTIME_WITHOUT_MITIGATED_NOTE)).toBeVisible();
    await expect(runtime.queryByTestId("card-line")).not.toBeInTheDocument();
    await expect((await topCard(canvas, "top-namespaces")).getByText(RUNTIME_WITHOUT_MITIGATED_NOTE)).toBeVisible();
    await expect(canvas.getAllByText(RUNTIME_WITHOUT_MITIGATED_NOTE)).toHaveLength(3);
    await expect(canvas.queryByRole("table", { name: NAMESPACES_TABLE })).not.toBeInTheDocument();

    // The Code and Image parts still show.
    await expectLines(image, [
      { name: "Trivy Scan", detail: "3 scans", counts: counts({ Critical: 2, High: 2 }) },
      { name: "Anchore Grype", detail: "1 scan", counts: null },
    ]);
    await expectLines(code, [
      { name: "Semgrep JSON Report", detail: "2 scans", counts: null },
      { name: "Gitleaks Scan", detail: "2 scans", counts: null },
    ]);
    await expect(linkNames(listItems(canvas, TOP_CODEBASES), /^Findings of /)).toEqual(["Findings of test-go-app"]);
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

export const NotConfigured: Story = {
  decorators: seeded(recordedOutage("notConfigured")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both parts read one DefectDojo: the page says so once, in place of the cards.
    await expect(await canvas.findByText("DefectDojo is not connected")).toBeVisible();
    await expect(canvas.getAllByText("DefectDojo is not connected")).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: /Learn more/ })).toHaveAttribute(
      "href",
      expect.stringContaining("defectdojo")
    );
    await expect(canvas.queryByRole("region", { name: "Findings by level" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("region", { name: "Where to start" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("heading", { name: "Runtime" })).not.toBeInTheDocument();
    await expect(group(canvas, "Level").getByRole("button", { name: "Runtime" })).toBeEnabled();
  },
};

/** The one alert of the page: its title, its message and an enabled Retry. */
async function expectUnreachable(canvas: Scope, message: string): Promise<void> {
  const alerts = await canvas.findAllByRole("alert");
  await expect(alerts).toHaveLength(1);
  const alert = within(alerts[0]);
  await expect(alert.getByText("DefectDojo is unreachable")).toBeVisible();
  await expect(alert.getByText(message)).toBeVisible();
  // The page asks again on mount, as it does after an outage; the button is off while it does.
  await waitFor(() => expect(alert.getByRole("button", { name: "Retry" })).toBeEnabled());
  await expect(alerts[0]).not.toHaveTextContent(/https?:|token/i);
}

export const UnreachableRuntime: Story = {
  decorators: seeded({ ...recordedAnswers("active"), runtime: recordedOutage("unreachable").runtime }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");

    // One alert for the part; its places say they cannot be loaded.
    await expectUnreachable(canvas, "Runtime findings cannot be loaded. The rest of the page is not affected.");
    await expect(runtime.getByText("Runtime findings cannot be loaded.")).toBeVisible();
    await expect(
      (await topCard(canvas, "top-namespaces")).getByText("Runtime findings cannot be loaded.")
    ).toBeVisible();
    await expect(runtime.queryByTestId("card-line")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("table", { name: NAMESPACES_TABLE })).not.toBeInTheDocument();

    // The Code and Image part is not affected.
    for (const level of ["image", "code"] as const) {
      await expect((await levelCard(canvas, level)).getAllByTestId("card-line")).toHaveLength(2);
    }
    await expect(listItems(canvas, TOP_CODEBASES)).toHaveLength(2);
  },
};

export const UnreachableCodebases: Story = {
  decorators: seeded({ ...recordedAnswers("active"), codebases: recordedOutage("unreachable").codebases }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectUnreachable(canvas, "Code and Image findings cannot be loaded. The rest of the page is not affected.");
    for (const place of [
      await levelCard(canvas, "image"),
      await levelCard(canvas, "code"),
      await topCard(canvas, "top-codebases"),
    ]) {
      await expect(place.getByText("Code and Image findings cannot be loaded.")).toBeVisible();
      await expect(place.queryByTestId("card-line")).not.toBeInTheDocument();
    }

    // The Runtime part is not affected.
    await expect((await levelCard(canvas, "runtime")).getAllByTestId("card-line")).toHaveLength(2);
    await expect(await canvas.findByRole("table", { name: NAMESPACES_TABLE })).toBeVisible();
    await expect(listItems(canvas, TOP_NAMESPACES)).toHaveLength(5);
  },
};

export const UnreachableBoth: Story = {
  decorators: seeded(recordedOutage("unreachable")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both parts read one DefectDojo: one alert, whose Retry asks for both.
    await expectUnreachable(canvas, "Security findings cannot be loaded.");
    await expect((await levelCard(canvas, "runtime")).getByText("Runtime findings cannot be loaded.")).toBeVisible();
    await expect(
      (await levelCard(canvas, "code")).getByText("Code and Image findings cannot be loaded.")
    ).toBeVisible();
  },
};

/** Filters that leave nothing say so; they do not say that DefectDojo holds no scan data. */
export const NoMatch: Story = {
  args: { search: { severity: "Info", namespace: "krci-demo-qa", codebase: "krci-gitops" } },
  decorators: seeded(recordedAnswers("active")),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect((await levelCard(canvas, "runtime")).getByText("No namespace matches the filters.")).toBeVisible();
    for (const level of ["image", "code"] as const) {
      await expect((await levelCard(canvas, level)).getByText("No scan matches the filters.")).toBeVisible();
    }
    await expect(canvas.queryByText("No scan data")).not.toBeInTheDocument();
  },
};

export const NoScanDataRuntimeSynthetic: Story = {
  decorators: seeded({ ...recordedAnswers("active"), runtime: NO_RUNTIME_SCAN_DATA }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = await levelCard(canvas, "runtime");

    await expect(await runtime.findByText("No scan data")).toBeVisible();
    await expect(
      runtime.getByText("The security operator has not reported Runtime findings for this installation.")
    ).toBeVisible();
    await expect(
      runtime.getByText("DefectDojo holds no namespace product of the configured Product Type.")
    ).toBeVisible();
    await expect(runtime.queryByTestId("card-line")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("table", { name: NAMESPACES_TABLE })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    // The Code and Image part is not affected.
    await expect(cardLine(await levelCard(canvas, "image"), "Trivy Scan").getByText("3 scans")).toBeVisible();
    await expect(listItems(canvas, TOP_CODEBASES)).toHaveLength(2);
  },
};

export const NoScanDataCodebasesSynthetic: Story = {
  args: { search: { tab: "codebases" } },
  decorators: seeded({ ...recordedAnswers("active"), codebases: syntheticNoScanDataCodebases() }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = await levelCard(canvas, "image");
    const code = await levelCard(canvas, "code");

    for (const card of [image, code, await topCard(canvas, "top-codebases")]) {
      await expect(await card.findByText("No scan data")).toBeVisible();
      await expect(card.getByText(NO_CODEBASE_SCAN_DATA)).toBeVisible();
      await expect(card.queryByTestId("card-line")).not.toBeInTheDocument();
    }

    // The Codebases tab still names the Codebases without a CI test.
    const rows = bodyRows(await tableOf(canvas, CODEBASES_TABLE));
    await expect(rows).toHaveLength(2);
    for (const [index, name] of ["krci-gitops", "test-go-app"].entries()) {
      const row = within(rows[index]);
      await expect(row.getByText("No scan data")).toBeVisible();
      await expect(row.getByRole("link", { name: `Security findings of ${name}` })).toBeVisible();
      await expect(row.getAllByRole("img", { name: /: no scan data$/ })).toHaveLength(DEFECTDOJO_SEVERITIES.length);
    }

    // The Runtime part is not affected.
    await expect((await levelCard(canvas, "runtime")).getAllByTestId("card-line")).toHaveLength(2);
  },
};

export const Loading: Story = {
  decorators: [withPendingTrpc(), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const place of [
      await levelCard(canvas, "runtime"),
      await levelCard(canvas, "image"),
      await levelCard(canvas, "code"),
      await topCard(canvas, "top-namespaces"),
      await topCard(canvas, "top-codebases"),
    ]) {
      await expect(place.getByRole("status")).toBeVisible();
      await expect(place.getByText("Loading...")).toBeInTheDocument();
    }
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(canvas.queryByText("No scan data")).not.toBeInTheDocument();
    await expect(group(canvas, "Level").getByRole("button", { name: "All" })).toBeEnabled();
  },
};

export const LoadFailed: Story = {
  decorators: [withFailingTrpc(FORBIDDEN_MESSAGE), withAppProviders()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both parts failed alike, the answer is no DefectDojo state: one alert, with the message of the server.
    const alerts = await canvas.findAllByRole("alert");
    await expect(alerts).toHaveLength(1);
    const alert = within(alerts[0]);
    await expect(alert.getByText("Failed to load security findings")).toBeVisible();
    await expect(alert.getByText(FORBIDDEN_MESSAGE)).toBeVisible();
    await waitFor(() => expect(alert.getByRole("button", { name: "Retry" })).toBeEnabled());
    await expect((await levelCard(canvas, "runtime")).getByText("Runtime findings cannot be loaded.")).toBeVisible();
    await expect(
      (await topCard(canvas, "top-codebases")).getByText("Code and Image findings cannot be loaded.")
    ).toBeVisible();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
  },
};
