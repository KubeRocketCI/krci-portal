import type { Meta, StoryObj } from "@storybook/react-vite";
import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY, type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { expect, userEvent, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import type { SecurityCiSummary, SecurityCodebaseSummary, SecurityRuntimeSummary } from "@my-project/shared";
import type { RequestError } from "@/core/types/global";
import { SecurityFindingsTabContent } from "./SecurityFindingsTabContent";

function createRequestError(httpStatus: number, code: TRPC_ERROR_CODE_KEY, message: string): RequestError {
  return TRPCClientError.from({
    error: {
      code: TRPC_ERROR_CODES_BY_KEY[code],
      message,
      data: { code, httpStatus },
    },
  });
}

const DD = "https://defectdojo.example.com";

const summary: SecurityCodebaseSummary = {
  status: "OK",
  codebase: "test-go-app",
  link: `${DD}/product/3`,
  ci: [
    {
      kind: "code",
      engagement: "code-security-main",
      branch: "main",
      tools: ["Gitleaks Scan", "Semgrep JSON Report"],
      counts: { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 },
      updated: "2026-11-10T20:18:32.486324Z",
      link: `${DD}/engagement/3`,
    },
    {
      kind: "image",
      engagement: "image:busybox",
      image: "busybox",
      tools: ["Anchore Grype", "Trivy Scan"],
      counts: { critical: 0, high: 3, medium: 0, low: 0, unassigned: 0 },
      updated: "2026-11-10T19:57:35.945959Z",
      link: `${DD}/engagement/2`,
    },
  ],
  runtime: [
    {
      environment: "demo/dev",
      workloads: ["deployment/test-go-app"],
      versions: ["main-20261110-194848"],
      tools: ["Trivy Operator Scan"],
      counts: { critical: 0, high: 1, medium: 0, low: 0, unassigned: 78 },
      updated: "2026-11-11T11:13:24.864078Z",
      link: `${DD}/engagement/48`,
    },
  ],
};

const threeImagesSummary: SecurityCodebaseSummary = {
  ...summary,
  ci: [
    ...summary.ci,
    {
      kind: "image",
      engagement: "image:api",
      image: "api",
      tag: "1.4.2",
      tools: ["Trivy Scan"],
      counts: { critical: 2, high: 14, medium: 31, low: 9, unassigned: 4 },
      updated: "2026-11-10T19:40:00Z",
      link: `${DD}/engagement/4`,
    },
    {
      kind: "image",
      engagement: "image:worker",
      image: "worker",
      tag: "1.4.2",
      tools: ["Trivy Scan"],
      counts: { critical: 0, high: 5, medium: 12, low: 20, unassigned: 0 },
      updated: "2026-11-10T19:41:00Z",
      link: `${DD}/engagement/5`,
    },
  ],
  runtime: [
    ...summary.runtime,
    {
      environment: "demo/prod",
      workloads: ["deployment/test-go-app"],
      versions: ["main-20261109-101500", "main-20261108-091200"],
      tools: ["Trivy Operator Scan"],
      counts: { critical: 2, high: 14, medium: 31, low: 9, unassigned: 4 },
      updated: "2026-11-11T10:00:00Z",
      link: `${DD}/engagement/49`,
    },
  ],
};

const LONG_NAME = "payments-platform-release-candidate-validation-pipeline-for-the-eu-central-region";
const LONG_STAGE = "staging-blue-green-validation-with-extended-soak-tests-and-synthetic-traffic";
const LONG_TAG = "release-2026.11.10-build.4821-sha.9f8e7d6c5b4a39281706f5e4d3c2b1a09876543210fedcba";

/** Deterministic spread so the story renders the same every time. */
function pseudoCount(seed: number, scale: number): number {
  return Math.floor(((Math.sin(seed * 12.9898) + 1) / 2) * scale);
}

const largeCi: SecurityCiSummary[] = [
  {
    kind: "code",
    engagement: "code-security-main",
    branch: "main",
    tools: ["Semgrep JSON Report"],
    counts: { critical: 3, high: 41, medium: 212, low: 960, unassigned: 120 },
    updated: "2026-11-10T20:18:32Z",
    link: `${DD}/engagement/100`,
  },
  ...["api", "worker", "scheduler", `${LONG_NAME}-image`].map(
    (image, index): SecurityCiSummary => ({
      kind: "image",
      engagement: `image:${image}`,
      image,
      tag: index === 3 ? LONG_TAG : `1.${index}.0`,
      tools: ["Trivy Scan", "Anchore Grype"],
      counts: {
        critical: pseudoCount(index + 1, 40) + (index === 0 ? 12_000 : 0),
        high: pseudoCount(index + 11, 900),
        medium: pseudoCount(index + 21, 4000),
        low: pseudoCount(index + 31, 8000),
        unassigned: pseudoCount(index + 41, 300),
      },
      updated: "2026-11-10T19:57:35Z",
      link: `${DD}/engagement/${101 + index}`,
    })
  ),
];

const largeRuntime: SecurityRuntimeSummary[] = Array.from({ length: 30 }, (_, index) => {
  const isHot = index === 0;
  const isClean = index % 9 === 8;

  return {
    environment: index % 3 === 0 ? `${LONG_NAME}/${LONG_STAGE}-${index}` : `team-${index}/stage-${index}`,
    workloads: ["deployment/api", "deployment/worker"],
    versions:
      index % 4 === 0
        ? [LONG_TAG, "main-20261109-101500", "main-20261108-091200", "main-20261107-081100", "main-20261106-071000"]
        : [`main-202611${String(10 - (index % 5)).padStart(2, "0")}-1948${index}`],
    tools: ["Trivy Operator Scan"],
    counts: isClean
      ? { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 }
      : {
          critical: isHot ? 12_400 : pseudoCount(index, 30),
          high: isHot ? 18_250 : pseudoCount(index + 50, 700),
          medium: isHot ? 1_240_000 : pseudoCount(index + 100, 5000),
          low: pseudoCount(index + 150, 9000),
          unassigned: pseudoCount(index + 200, 2500),
        },
    updated: "2026-11-11T11:13:24Z",
    link: `${DD}/engagement/${200 + index}`,
  };
});

const largeSummary: SecurityCodebaseSummary = {
  status: "OK",
  codebase: "test-go-app",
  link: `${DD}/product/3`,
  ci: largeCi,
  runtime: largeRuntime,
};

const baseArgs = { clusterName: "test-cluster", namespace: "test-ns" };

const meta = {
  title: "Platform/Codebases/SecurityFindingsTab",
  component: SecurityFindingsTabContent,
  parameters: {
    layout: "padded",
  },
  decorators: [withAppProviders()],
} satisfies Meta<typeof SecurityFindingsTabContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ...baseArgs, summary, isLoading: false, error: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Security findings" })).toBeVisible();
    await expect(await canvas.findByRole("img", { name: /^Severity composition, Runtime/ })).toBeVisible();

    const ci = canvas.getByRole("region", { name: "CI" });
    await expect(within(ci).getByText("Code scan: main")).toBeVisible();
    await expect(within(ci).getByText("Image scan: busybox")).toBeVisible();

    const runtime = canvas.getByRole("region", { name: "Runtime" });
    const stageHref = "/c/test-cluster/cdpipelines/test-ns/demo/stages/dev";
    await expect(within(runtime).getByRole("link", { name: "demo/dev" })).toHaveAttribute(
      "href",
      expect.stringContaining(stageHref)
    );
    await expect(within(runtime).getByRole("link", { name: "Open stage demo/dev" })).toHaveAttribute(
      "href",
      expect.stringContaining(stageHref)
    );
    await expect(within(runtime).getByRole("link", { name: "Open demo/dev in DefectDojo" })).toHaveAttribute(
      "href",
      `${DD}/engagement/48`
    );
    await expect(within(runtime).getByText("main-20261110-194848")).toBeVisible();
    await expect(within(runtime).getByTitle("Unassigned: 78")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Open in DefectDojo" })).toHaveAttribute("href", `${DD}/product/3`);
  },
};

/** Code scan plus three images and two environments: totals and charts follow the Runtime/CI switch. */
export const ThreeImages: Story = {
  args: { ...baseArgs, summary: threeImagesSummary, isLoading: false, error: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ci = canvas.getByRole("region", { name: "CI" });
    await expect(within(ci).getAllByRole("link", { name: /^Open .+ in DefectDojo$/ })).toHaveLength(4);
    await expect(await canvas.findByRole("img", { name: /Findings per scope: CI code 0, CI image/ })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "CI" }));
    await expect(canvas.getByRole("button", { name: "CI" })).toHaveAttribute("aria-pressed", "true");
    await expect(await canvas.findByRole("img", { name: /^Severity composition, CI/ })).toBeVisible();
  },
};

/** 30 environments, 5 images, counts above 10,000 and names and versions of 80+ characters. */
export const Large: Story = {
  args: { ...baseArgs, summary: largeSummary, isLoading: false, error: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runtime = canvas.getByRole("region", { name: "Runtime" });
    const entryLinks = () => within(runtime).getAllByRole("link", { name: /^Open .+ in DefectDojo$/ });

    await expect(entryLinks()).toHaveLength(10);
    await expect(within(runtime).getByText("12.4K")).toBeVisible();
    await expect(within(runtime).getByTitle("Critical: 12,400")).toBeVisible();
    await expect(within(runtime).getByText("1.2M")).toBeVisible();

    await userEvent.click(within(runtime).getByRole("button", { name: "Show all (30)" }));
    await expect(entryLinks()).toHaveLength(30);
    await expect(within(runtime).getByRole("button", { name: "Show first 10" })).toBeVisible();

    await userEvent.click(await canvas.findByRole("button", { name: "Show all (30)" }));
    await expect(canvas.getByRole("button", { name: "Show top 10" })).toBeVisible();
  },
};

export const Dark: Story = {
  args: { ...baseArgs, summary: threeImagesSummary, isLoading: false, error: null },
  render: (args) => (
    <div className="dark bg-background text-foreground rounded-lg p-4">
      <SecurityFindingsTabContent {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Security findings" })).toBeVisible();
    await expect(await canvas.findByRole("img", { name: /^Severity composition, Runtime/ })).toBeVisible();
  },
};

export const DarkLarge: Story = {
  args: { ...baseArgs, summary: largeSummary, isLoading: false, error: null },
  render: (args) => (
    <div className="dark bg-background text-foreground rounded-lg p-4">
      <SecurityFindingsTabContent {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Runtime" })).toBeVisible();
  },
};

export const NotScanned: Story = {
  args: {
    ...baseArgs,
    summary: { status: "NONE", codebase: "test-go-app", ci: [], runtime: [] },
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Not scanned/)).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Open in DefectDojo" })).not.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { ...baseArgs, summary: undefined, isLoading: true, error: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status", { name: "Loading security findings" })).toBeVisible();
  },
};

export const Forbidden: Story = {
  args: {
    ...baseArgs,
    summary: undefined,
    isLoading: false,
    error: createRequestError(403, "FORBIDDEN", "Forbidden"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("You don't have permissions");
  },
};

export const NotFound: Story = {
  args: {
    ...baseArgs,
    summary: undefined,
    isLoading: false,
    error: createRequestError(404, "NOT_FOUND", "Not found"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("The requested resource was not found.");
  },
};

export const ServerError: Story = {
  args: {
    ...baseArgs,
    summary: undefined,
    isLoading: false,
    error: createRequestError(503, "SERVICE_UNAVAILABLE", "DefectDojo is not configured"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("DefectDojo is not configured");
  },
};
