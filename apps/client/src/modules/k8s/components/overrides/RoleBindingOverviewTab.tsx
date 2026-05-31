import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { KubeObjectBase, RoleBinding } from "@my-project/shared";
import { SubjectsCard, type RbacSubject } from "@/modules/k8s/components/rbac";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

export function RoleBindingOverviewTab({ item }: { item: KubeObjectBase }) {
  const rb = item as RoleBinding;
  const subjects = (rb.subjects ?? []) as RbacSubject[];
  const roleRef = rb.roleRef;
  const namespace = rb.metadata?.namespace;
  const created = rb.metadata?.creationTimestamp;

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Role Ref"
          value={
            <span className="font-mono text-xs">
              {roleRef.kind}/{roleRef.name}
            </span>
          }
          sub="Bound role"
        />
        <WorkloadSummaryCard label="Subjects" value={subjects.length} sub="Bound to" />
        <WorkloadSummaryCard label="Namespace" value={namespace ?? "—"} sub="Scope" />
        <WorkloadSummaryCard
          label="Created"
          value={formatRelativeTime(created)}
          sub={
            created ? (
              <Tooltip title={created}>
                <span>{formatTimestamp(created)}</span>
              </Tooltip>
            ) : (
              "—"
            )
          }
        />
      </WorkloadSummaryGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <WorkloadInformationCard title="Role Reference">
            <WorkloadInfoRow label="Kind">{roleRef.kind}</WorkloadInfoRow>
            <WorkloadInfoRow label="Name" mono>
              {roleRef.name}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="API Group">{roleRef.apiGroup || "—"}</WorkloadInfoRow>
          </WorkloadInformationCard>
          <SubjectsCard subjects={subjects} />
          <WorkloadInformationCard>
            <WorkloadInfoRow label="Namespace">{namespace ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Subjects">{subjects.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {rb.metadata?.uid ?? "—"}
            </WorkloadInfoRow>
          </WorkloadInformationCard>
        </div>
        <div className="lg:col-span-1">
          <WorkloadOverviewSidebar item={item} />
        </div>
      </div>
    </div>
  );
}
