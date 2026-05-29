import { Badge } from "@/core/components/ui/badge";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import type { CRDObject, KubeObjectBase } from "@my-project/shared";
import { ageColumn } from "./columnHelpers";
import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";

export const crdsMvpColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => {
  const name: TableColumn<KubeObjectBase> = {
    id: "name",
    label: "Name (Kind)",
    data: {
      render: ({ data }) => {
        // Intentional UX trade-off: CRDs show spec.names.kind as the primary cell text
        // (more meaningful than the dotted metadata.name like "argoprojects.argoproj.io")
        // and route navigation happens via row click, not a name link. The shared
        // renderName helper hardcodes metadata.name as the link text and offers no
        // display-text override, so we render the kind here. The full CRD metadata
        // name remains accessible via the line-clamp tooltip (and via the title
        // attribute on the outer wrapper for assistive tech).
        void renderName;
        const kind = (data as CRDObject).spec.names.kind;
        return (
          <div className="w-full min-w-0" title={data.metadata?.name}>
            <TextWithTooltip text={kind} />
          </div>
        );
      },
      columnSortableValuePath: "metadata.name",
    },
    cell: { baseWidth: 16 },
  };

  const group: TableColumn<KubeObjectBase> = {
    id: "group",
    label: "Group",
    data: {
      render: ({ data }) => (
        <div className="w-full min-w-0">
          <TextWithTooltip text={(data as CRDObject).spec.group} />
        </div>
      ),
      columnSortableValuePath: "spec.group",
    },
    cell: { baseWidth: 14 },
  };

  const scope: TableColumn<KubeObjectBase> = {
    id: "scope",
    label: "Scope",
    data: {
      render: ({ data }) => {
        const s = (data as CRDObject).spec.scope;
        return <Badge variant={s === "Cluster" ? "secondary" : "outline"}>{s}</Badge>;
      },
    },
    cell: { baseWidth: 8 },
  };

  const established: TableColumn<KubeObjectBase> = {
    id: "established",
    label: "Established",
    data: {
      render: ({ data }) => {
        const c = (data as CRDObject).status?.conditions?.find((cc) => cc.type === "Established");
        if (c?.status === "True") return <Badge variant="success">True</Badge>;
        if (c?.status === "False") return <Badge variant="destructive">False</Badge>;
        return <Badge variant="secondary">Unknown</Badge>;
      },
    },
    cell: { baseWidth: 9 },
  };

  return [name, group, scope, established, ageColumn];
};
