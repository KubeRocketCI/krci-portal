import { describe, expect, it } from "vitest";
import { createColumnComparator } from "@/core/components/Table/sort";
import { SORT_ORDERS } from "@/core/components/Table/constants";
import type { TableColumn } from "@/core/components/Table/types";
import { createResourceNameGetter } from "./createResourceNameGetter";

const LABEL = "trivy-operator.resource.name";
const getResourceName = createResourceNameGetter(LABEL);

type Report = Parameters<typeof getResourceName>[0];

const report = (name: string, resourceName?: string): Report => ({
  metadata: { name, labels: resourceName ? { [LABEL]: resourceName } : undefined },
});

describe("createResourceNameGetter", () => {
  it("prefers the resource label", () => {
    expect(getResourceName(report("replicaset-web-7d9", "web"))).toBe("web");
  });

  it("falls back to the report name without the label", () => {
    expect(getResourceName(report("job-nolabel"))).toBe("job-nolabel");
  });

  it("returns undefined for a report with neither", () => {
    expect(getResourceName({})).toBeUndefined();
  });

  it("orders rows by the shown name, not by the <kind>-<name> report name", () => {
    const rows = [
      report("service-alpha", "alpha"),
      report("replicaset-zeta-5f6c", "zeta"),
      report("deployment-beta", "beta"),
      report("job-nolabel"),
    ];
    const column = {
      id: "resourceName",
      label: "Resource Name",
      data: { render: () => null, columnSortableValue: getResourceName },
      cell: { baseWidth: 10 },
    } as TableColumn<Report>;

    const sorted = [...rows].sort(createColumnComparator(column, SORT_ORDERS.ASC)).map(getResourceName);

    expect(sorted).toEqual(["alpha", "beta", "job-nolabel", "zeta"]);

    // The premise: by report name (<kind>-<name>) the same rows come out in another order.
    const byReportName = [...rows]
      .sort((x, y) => (x.metadata?.name ?? "").localeCompare(y.metadata?.name ?? ""))
      .map(getResourceName);
    expect(byReportName).toEqual(["beta", "job-nolabel", "zeta", "alpha"]);
  });
});
