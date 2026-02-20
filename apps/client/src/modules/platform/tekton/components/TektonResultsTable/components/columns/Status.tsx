import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { getTektonResultStatusIcon } from "@/modules/platform/tekton/utils/statusIcons";
import { TektonResult, TektonResultStatus } from "@my-project/shared";

export const StatusColumn = ({ tektonResult }: { tektonResult: TektonResult }) => {
  const status = tektonResult.summary?.status || "UNKNOWN";
  const statusIcon = getTektonResultStatusIcon(status as TektonResultStatus);

  return (
    <Badge className="h-6" style={{ backgroundColor: `${statusIcon.color}15`, color: statusIcon.color }}>
      <StatusIcon Icon={statusIcon.Icon} color={statusIcon.color} isSpinning={statusIcon.isSpinning} width={12} />
      <span className="capitalize">{statusIcon.title}</span>
    </Badge>
  );
};
