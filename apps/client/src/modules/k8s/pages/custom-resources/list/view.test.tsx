import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/k8s/hooks/useCRDByGVR", () => ({
  useCRDByGVR: vi.fn(),
}));

vi.mock("@/modules/k8s/hooks/useCRList", () => ({
  useCRList: vi.fn(),
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (s: { defaultNamespace: string }) => unknown) => selector({ defaultNamespace: "dev" }),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useParams: () => ({ clusterName: "c1", group: "tekton.dev", version: "v1", plural: "pipelineruns" }),
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
    Link: ({ children, ...rest }: { children: React.ReactNode; [k: string]: unknown }) => (
      <a {...(rest as Record<string, string>)}>{children}</a>
    ),
  };
});

// Mock ResourceTable to avoid deep tree (DataTable, BatchDeleteDialog, etc.)
// but still render items and column labels so we can assert on them.
vi.mock("@/modules/k8s/components/ResourceTable", () => ({
  ResourceTable: ({
    items,
    descriptor,
  }: {
    items: { metadata?: { name?: string; namespace?: string; [k: string]: unknown }; [k: string]: unknown }[];
    descriptor: {
      columns: (renderName: (item: unknown) => React.ReactNode) => {
        id: string;
        label: string;
        data: { render: (args: { data: unknown; meta: unknown }) => React.ReactNode };
      }[];
      config: { clusterScoped?: boolean };
      label: string;
    };
  }) => {
    const cols = descriptor.columns((item) => {
      const obj = item as { metadata?: { name?: string } };
      return <span>{obj.metadata?.name ?? ""}</span>;
    });
    return (
      <table>
        <thead>
          <tr>
            {cols.map((col) => (
              <th key={col.id}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={idx}>
              {cols.map((col) => (
                <td key={col.id}>{col.data.render({ data: row, meta: { selectionLength: 0 } })}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

import { useCRDByGVR } from "@/modules/k8s/hooks/useCRDByGVR";
import { useCRList } from "@/modules/k8s/hooks/useCRList";
import CRListView from "./view";

const defaultCrd = {
  metadata: { name: "pipelineruns.tekton.dev", uid: "u1", creationTimestamp: "2026-05-15T10:00:00Z" },
  spec: {
    group: "tekton.dev",
    scope: "Namespaced",
    names: { kind: "PipelineRun", plural: "pipelineruns", singular: "pipelinerun" },
    versions: [
      {
        name: "v1",
        served: true,
        storage: true,
        additionalPrinterColumns: [{ name: "Status", type: "string", jsonPath: ".status.phase" }],
      },
    ],
  },
};

const baseWatchResult = (items: unknown[]) => ({
  data: { array: items, map: new Map() },
  query: { isSuccess: true, isPlaceholderData: false, error: null },
  resourceVersion: "1",
  isEmpty: items.length === 0,
  isLoading: false,
  isReady: true,
  error: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCRDByGVR).mockReturnValue({ crd: defaultCrd as never, isLoading: false, error: null });
  vi.mocked(useCRList).mockReturnValue(
    baseWatchResult([
      { metadata: { name: "pr-1", namespace: "dev" }, status: { phase: "Running" } },
      { metadata: { name: "pr-2", namespace: "dev" }, status: { phase: "Succeeded" } },
    ]) as never
  );
});

describe("CRListView", () => {
  it("renders dynamic Status column from priority=0 printer columns", () => {
    render(<CRListView />);
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("shows the namespace column for namespaced CRDs", () => {
    render(<CRListView />);
    expect(screen.getByRole("columnheader", { name: /namespace/i })).toBeInTheDocument();
  });

  it("unknown GVR shows empty state", () => {
    vi.mocked(useCRDByGVR).mockReturnValueOnce({ crd: undefined, isLoading: false, error: null });
    render(<CRListView />);
    // Both the page title and the body paragraph contain "Unknown custom resource",
    // so use getAllByText and assert at least one element is present.
    expect(screen.getAllByText(/unknown custom resource/i).length).toBeGreaterThan(0);
  });

  it("loading CRD shows Loading… state", () => {
    vi.mocked(useCRDByGVR).mockReturnValueOnce({ crd: undefined, isLoading: true, error: null });
    render(<CRListView />);
    expect(screen.getByText(/Loading CRD/i)).toBeInTheDocument();
  });
});
