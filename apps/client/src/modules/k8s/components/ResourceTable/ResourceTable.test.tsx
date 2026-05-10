import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResourceTable } from "./index";
import type { ResourceDescriptor } from "../../registry/types";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";

vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await (orig as () => Promise<Record<string, unknown>>)()),
  useNavigate: () => () => {},
  useParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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
});
