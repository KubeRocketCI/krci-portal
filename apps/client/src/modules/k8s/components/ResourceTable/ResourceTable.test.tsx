import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResourceTable } from "./index";
import type { ResourceDescriptor } from "../../registry/types";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";

// Capture rendered `to` props from Link so test assertions can check the route.
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await (orig as () => Promise<Record<string, unknown>>)()),
  useNavigate: () => () => {},
  useParams: () => ({}),
  Link: ({ children, to, params }: { children: React.ReactNode; to?: string; params?: Record<string, string> }) => {
    // Build a deterministic href from the `to` template + `params` so tests can
    // assert on the exact URL without relying on TanStack Router internals.
    let href = to ?? "";
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`$${key}`, encodeURIComponent(value));
      });
    }
    return <a href={href}>{children}</a>;
  },
}));

vi.mock("@/core/components/Table", () => ({
  DataTable: ({ data, columns }: { data: unknown[]; columns: TableColumn<unknown>[] }) => (
    <table>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.id}>{col.data.render({ data: row, meta: { selectionLength: 0 } })}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: () => "test-cluster",
}));

// PrinterColumnValue is used in CR descriptor columns; stub it out to avoid
// jsonpath/deep-render overhead in unit tests.
vi.mock("@/modules/k8s/components/PrinterColumnValue", () => ({
  PrinterColumnValue: ({ item, jsonPath }: { item: unknown; jsonPath: string }) => (
    <span data-testid="printer-col" data-jsonpath={jsonPath}>
      {JSON.stringify(item)}
    </span>
  ),
}));

describe("ResourceTable", () => {
  const items: KubeObjectBase[] = [
    {
      kind: "Deployment",
      apiVersion: "apps/v1",
      metadata: { name: "alpha", uid: "u1", namespace: "ns", creationTimestamp: "" },
    },
    {
      kind: "Deployment",
      apiVersion: "apps/v1",
      metadata: { name: "beta", uid: "u2", namespace: "ns", creationTimestamp: "" },
    },
  ];

  const descriptor: ResourceDescriptor = {
    config: {
      kind: "Deployment",
      group: "apps",
      version: "v1",
      apiVersion: "apps/v1",
      singularName: "deployment",
      pluralName: "deployments",
    },
    label: "Deployments",
    detailVariant: "namespaced",
    sidebarGroup: "Workloads",
    columns: (renderName) => [
      {
        id: "name",
        label: "Name",
        data: {
          render: ({ data }) => renderName(data),
          columnSortableValuePath: "metadata.name",
        },
        cell: { baseWidth: 100 },
      },
    ],
  };

  it("renders a row per item", () => {
    render(<ResourceTable items={items} descriptor={descriptor} isLoading={false} error={null} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  describe("CR descriptor (customResource=true) with printer columns", () => {
    // Minimal CRD fixture — namespaced with one priority=0 printer column so
    // visible.length >= 1 and the yamlIconColumn branch is NOT taken.
    const crItems: KubeObjectBase[] = [
      {
        kind: "PipelineRun",
        apiVersion: "tekton.dev/v1",
        metadata: { name: "pr-1", uid: "cr-u1", namespace: "dev", creationTimestamp: "" },
      },
    ];

    const crDescriptor: ResourceDescriptor = {
      config: {
        kind: "PipelineRun",
        group: "tekton.dev",
        version: "v1",
        apiVersion: "tekton.dev/v1",
        singularName: "pipelinerun",
        pluralName: "pipelineruns",
      },
      label: "PipelineRuns",
      detailVariant: "namespaced",
      customResource: true,
      sidebarGroup: "CustomResources",
      defaultSort: { sortBy: "name", order: "asc" },
      columns: (renderName) => [
        {
          id: "name",
          label: "Name",
          data: {
            render: ({ data }) => renderName(data),
            columnSortableValuePath: "metadata.name",
          },
          cell: { baseWidth: 30 },
        },
        // Simulate the printer column that buildCRDescriptor would add
        {
          id: "Status-0",
          label: "Status",
          data: {
            render: ({ data }) => (
              <span data-testid="printer-col" data-jsonpath=".status.phase">
                {JSON.stringify(data)}
              </span>
            ),
          },
          cell: { baseWidth: 20 },
        },
      ],
    };

    it("routes the name link to PATH_K8S_CR_DETAIL_NS_FULL for namespaced CR with printer columns", () => {
      render(<ResourceTable items={crItems} descriptor={crDescriptor} isLoading={false} error={null} />);

      // The name "pr-1" should be rendered as a link
      const link = screen.getByRole("link", { name: "pr-1" });
      expect(link).toBeInTheDocument();

      // The href must use the CR namespaced detail route pattern:
      // /c/$clusterName/k8s/cr/ns/$group/$version/$plural/$namespace/$name
      // with resolved params: clusterName=test-cluster, group=tekton.dev,
      // version=v1, plural=pipelineruns, namespace=dev, name=pr-1
      const href = link.getAttribute("href") ?? "";
      expect(href).toContain("/k8s/cr/ns/");
      expect(href).toContain("tekton.dev");
      expect(href).toContain("v1");
      expect(href).toContain("pipelineruns");
      expect(href).toContain("dev");
      expect(href).toContain("pr-1");

      // Must NOT use the standard built-in kind route
      expect(href).not.toContain("/k8s/ns/");
    });
  });
});
