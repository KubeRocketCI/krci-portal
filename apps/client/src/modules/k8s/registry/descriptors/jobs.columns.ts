import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

const formatDuration = (start?: string, end?: string) => {
  if (!start) return "—";
  const startMs = Date.parse(start);
  const endMs = end ? Date.parse(end) : Date.now();
  const seconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

export const jobColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "completions",
    label: "Completions",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { succeeded?: number }; spec?: { completions?: number } };
        return `${s.status?.succeeded ?? 0}/${s.spec?.completions ?? 1}`;
      },
    },
    cell: { baseWidth: 14 },
  },
  {
    id: "duration",
    label: "Duration",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { startTime?: string; completionTime?: string } };
        return formatDuration(s.status?.startTime, s.status?.completionTime);
      },
    },
    cell: { baseWidth: 12 },
  },
  ageColumn,
];
