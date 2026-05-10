import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ScrollText, Terminal } from "lucide-react";
import type { Pod } from "@my-project/shared";

type ContainerLike = NonNullable<Pod["spec"]>["containers"][number];
type ContainerStatusLike = NonNullable<NonNullable<Pod["status"]>["containerStatuses"]>[number];

interface ContainerRowProps {
  container: ContainerLike;
  status?: ContainerStatusLike;
  variant: "init" | "main";
  onOpenLogs: (name: string) => void;
  onOpenShell: (name: string) => void;
}

function stateLabel(status?: ContainerStatusLike): { label: string; tone: "ok" | "warn" | "err" | "muted" } {
  const state = status?.state;
  if (!state) return { label: "Unknown", tone: "muted" };
  if (state.running) return { label: "Running", tone: "ok" };
  if (state.waiting) return { label: state.waiting.reason ?? "Waiting", tone: "warn" };
  if (state.terminated) {
    const reason = state.terminated.reason ?? `Exit ${state.terminated.exitCode}`;
    return { label: reason, tone: state.terminated.exitCode === 0 ? "ok" : "err" };
  }
  return { label: "Unknown", tone: "muted" };
}

const TONE_CLASSES: Record<"ok" | "warn" | "err" | "muted", string> = {
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  err: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  muted: "bg-muted text-muted-foreground",
};

function ContainerRow({ container, status, variant, onOpenLogs, onOpenShell }: ContainerRowProps) {
  const sl = stateLabel(status);
  return (
    <tr className="hover:bg-muted/40 group border-t">
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm">{container.name}</span>
            {variant === "init" && (
              <Badge variant="outline" className="text-[10px]">
                Init
              </Badge>
            )}
            {status?.ready && (
              <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">Ready</Badge>
            )}
          </div>
          {container.image && (
            <Tooltip title={container.image}>
              <span className="text-muted-foreground max-w-[280px] truncate font-mono text-xs">{container.image}</span>
            </Tooltip>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${TONE_CLASSES[sl.tone]}`}>
          {sl.label}
        </span>
      </td>
      <td className="px-3 py-2 text-sm">{status?.restartCount ?? 0}</td>
      <td className="px-3 py-2 text-right">
        <div className="invisible flex items-center justify-end gap-1 group-hover:visible">
          <button
            type="button"
            className="hover:bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs"
            onClick={() => onOpenLogs(container.name)}
          >
            <ScrollText size={12} /> Logs
          </button>
          <button
            type="button"
            className="hover:bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs"
            onClick={() => onOpenShell(container.name)}
          >
            <Terminal size={12} /> Shell
          </button>
        </div>
      </td>
    </tr>
  );
}

export function PodContainersCard({ pod }: { pod: Pod }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;

  const initContainers = pod.spec?.initContainers ?? [];
  const containers = pod.spec?.containers ?? [];
  const initStatuses = pod.status?.initContainerStatuses ?? [];
  const containerStatuses = pod.status?.containerStatuses ?? [];

  const findStatus = (statuses: ContainerStatusLike[], name: string) => statuses.find((s) => s.name === name);

  const openTab = (tab: "logs" | "shell", containerName: string) =>
    void navigate({ search: { ...search, tab, container: containerName } as never });

  const totalRows = initContainers.length + containers.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-baseline justify-between p-4">
        <CardTitle className="text-base font-semibold">Containers</CardTitle>
        <span className="text-muted-foreground text-xs">
          {totalRows} {totalRows === 1 ? "container" : "containers"}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">State</th>
              <th className="px-3 py-2 font-medium">Restarts</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {initContainers.map((c) => (
              <ContainerRow
                key={`init::${c.name}`}
                container={c}
                status={findStatus(initStatuses, c.name)}
                variant="init"
                onOpenLogs={(n) => openTab("logs", n)}
                onOpenShell={(n) => openTab("shell", n)}
              />
            ))}
            {containers.map((c) => (
              <ContainerRow
                key={`main::${c.name}`}
                container={c}
                status={findStatus(containerStatuses, c.name)}
                variant="main"
                onOpenLogs={(n) => openTab("logs", n)}
                onOpenShell={(n) => openTab("shell", n)}
              />
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
