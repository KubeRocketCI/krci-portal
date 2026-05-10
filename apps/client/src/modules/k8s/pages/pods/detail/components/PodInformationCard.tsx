import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { Pod } from "@my-project/shared";

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  full?: boolean;
}

function InfoRow({ label, children, mono, full }: InfoRowProps) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "font-mono text-xs break-all" : ""}`}>{children}</div>
    </div>
  );
}

const yesNo = (b: boolean | undefined) => (b ? "Yes" : "No");

export function PodInformationCard({ pod }: { pod: Pod }) {
  const owner = pod.metadata?.ownerReferences?.[0];
  const spec = pod.spec;
  const status = pod.status;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold">Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 pt-2 sm:grid-cols-2">
        <InfoRow label="Owner">
          {owner ? (
            <span className="font-mono text-xs">
              {owner.kind}/{owner.name}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </InfoRow>
        <InfoRow label="Started">
          {status?.startTime ? (
            <Tooltip title={status.startTime}>
              <span>{formatTimestamp(status.startTime)}</span>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </InfoRow>

        <InfoRow label="Service Account" mono>
          {spec?.serviceAccountName ?? spec?.serviceAccount ?? "default"}
        </InfoRow>
        <InfoRow label="QoS Class">{status?.qosClass ?? "—"}</InfoRow>

        <InfoRow label="Restart Policy">{spec?.restartPolicy ?? "—"}</InfoRow>
        <InfoRow label="Priority Class" mono>
          {spec?.priorityClassName ?? "—"}
        </InfoRow>

        <InfoRow label="DNS Policy">{spec?.dnsPolicy ?? "—"}</InfoRow>
        <InfoRow label="Host Network">{yesNo(spec?.hostNetwork)}</InfoRow>

        <InfoRow label="Termination Grace">
          {spec?.terminationGracePeriodSeconds !== undefined ? `${spec.terminationGracePeriodSeconds}s` : "—"}
        </InfoRow>
        <InfoRow label="Volumes">{spec?.volumes?.length ?? 0}</InfoRow>

        {spec?.schedulerName && spec.schedulerName !== "default-scheduler" && (
          <InfoRow label="Scheduler" mono>
            {spec.schedulerName}
          </InfoRow>
        )}
        {spec?.runtimeClassName && (
          <InfoRow label="Runtime Class" mono>
            {spec.runtimeClassName}
          </InfoRow>
        )}

        {spec?.nodeSelector && Object.keys(spec.nodeSelector).length > 0 && (
          <InfoRow label="Node Selector" mono full>
            {Object.entries(spec.nodeSelector)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}
          </InfoRow>
        )}

        <InfoRow label="UID" mono full>
          {pod.metadata?.uid ?? "—"}
        </InfoRow>
      </CardContent>
    </Card>
  );
}
