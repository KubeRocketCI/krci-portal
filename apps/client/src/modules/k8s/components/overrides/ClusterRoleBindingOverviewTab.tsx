import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { ClusterRoleBinding, KubeObjectBase } from "@my-project/shared";
import { SubjectsCard, type RbacSubject } from "@/modules/k8s/components/rbac";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

export function ClusterRoleBindingOverviewTab({ item }: { item: KubeObjectBase }) {
  const crb = item as ClusterRoleBinding;
  const subjects = (crb.subjects ?? []) as RbacSubject[];
  const roleRef = crb.roleRef;
  const created = crb.metadata?.creationTimestamp;

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
            <WorkloadInfoRow label="Subjects">{subjects.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {crb.metadata?.uid ?? "—"}
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
