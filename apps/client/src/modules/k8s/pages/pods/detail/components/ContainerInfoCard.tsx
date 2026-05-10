import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { Badge } from "@/core/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import type { Pod } from "@my-project/shared";

type ContainerLike = NonNullable<Pod["spec"]>["containers"][number];
type ContainerStatusLike = NonNullable<NonNullable<Pod["status"]>["containerStatuses"]>[number];

interface ContainerInfoCardProps {
  container: ContainerLike;
  status?: ContainerStatusLike;
  variant: "init" | "main";
}

function StateBadge({ status }: { status?: ContainerStatusLike }) {
  const state = status?.state;
  if (!state) return <Badge variant="secondary">Unknown</Badge>;
  if (state.running) return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Running</Badge>;
  if (state.waiting) {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">{state.waiting.reason ?? "Waiting"}</Badge>
    );
  }
  if (state.terminated) {
    const ok = state.terminated.exitCode === 0;
    return (
      <Badge
        className={
          ok
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
        }
      >
        {state.terminated.reason ?? `Exit ${state.terminated.exitCode}`}
      </Badge>
    );
  }
  return <Badge variant="secondary">Unknown</Badge>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function ListBlock({ items }: { items: Array<React.ReactNode> }) {
  if (items.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="space-y-1 font-mono text-xs">
      {items.map((it, i) => (
        <li key={i} className="break-all">
          {it}
        </li>
      ))}
    </ul>
  );
}

function formatResources(resources: ContainerLike["resources"]): {
  requests: Array<[string, string]>;
  limits: Array<[string, string]>;
} {
  const stringify = (r?: Record<string, unknown>): Array<[string, string]> =>
    r ? Object.entries(r).map(([k, v]) => [k, String(v)]) : [];
  return {
    requests: stringify(resources?.requests),
    limits: stringify(resources?.limits),
  };
}

function ProbeRow({ label, probe }: { label: string; probe?: NonNullable<ContainerLike>["livenessProbe"] }) {
  if (!probe) return null;
  const kind = probe.exec ? "exec" : probe.httpGet ? "httpGet" : probe.tcpSocket ? "tcp" : probe.grpc ? "grpc" : "—";
  const detail = probe.exec?.command?.join(" ") ?? probe.httpGet?.path ?? probe.httpGet?.port ?? probe.tcpSocket?.port;
  return (
    <li className="font-mono text-xs">
      <span className="text-muted-foreground">{label}:</span> {kind} {detail !== undefined ? `(${String(detail)})` : ""}
    </li>
  );
}

export function ContainerInfoCard({ container, status, variant }: ContainerInfoCardProps) {
  const resources = formatResources(container.resources);
  const itemValue = `container::${container.name}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-4 pb-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-medium">{container.name}</span>
          {variant === "init" && (
            <Badge variant="outline" className="text-[10px]">
              Init
            </Badge>
          )}
          {status?.ready ? (
            <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">Ready</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              Not Ready
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {status?.restartCount ?? 0} restarts
          </Badge>
        </div>
        <StateBadge status={status} />
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 pt-2 sm:grid-cols-2">
        <Field label="Image" full>
          {container.image ? (
            <Tooltip title={container.image}>
              <span className="block truncate font-mono text-xs">{container.image}</span>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>
        <Field label="Image Pull Policy">{container.imagePullPolicy ?? "IfNotPresent"}</Field>
        <Field label="Working Dir">
          {container.workingDir ? (
            <span className="font-mono text-xs">{container.workingDir}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>
        <Field label="Command" full>
          {container.command?.length ? (
            <code className="bg-muted block rounded px-2 py-1 text-xs break-all">{container.command.join(" ")}</code>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>
        <Field label="Args" full>
          {container.args?.length ? (
            <code className="bg-muted block rounded px-2 py-1 text-xs break-all">{container.args.join(" ")}</code>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>

        <div className="col-span-1 sm:col-span-2">
          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value={itemValue} className="bg-transparent shadow-none">
              <AccordionTrigger
                chevronPosition="right"
                className="text-muted-foreground border-t-0 px-0 py-2 text-xs uppercase"
              >
                Details
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-0 py-3">
                <Field label="Ports" full>
                  <ListBlock
                    items={
                      container.ports?.map(
                        (p) => `${p.containerPort}${p.protocol ? `/${p.protocol}` : ""}${p.name ? ` · ${p.name}` : ""}`
                      ) ?? []
                    }
                  />
                </Field>

                <Field label="Environment" full>
                  {(container.env?.length ?? 0) + (container.envFrom?.length ?? 0) === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="space-y-2">
                      {container.envFrom?.length ? (
                        <ul className="space-y-1 font-mono text-xs">
                          {container.envFrom.map((ef, i) => (
                            <li key={`envFrom::${i}`} className="text-muted-foreground">
                              envFrom: {ef.configMapRef ? `configMap/${ef.configMapRef.name}` : ""}
                              {ef.secretRef ? `secret/${ef.secretRef.name}` : ""}
                              {ef.prefix ? ` (prefix=${ef.prefix})` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {container.env?.length ? (
                        <ul className="space-y-1 font-mono text-xs">
                          {container.env.map((e) => (
                            <li key={e.name} className="break-all">
                              <span className="text-foreground">{e.name}</span>=
                              <span className="text-muted-foreground">
                                {e.value !== undefined ? e.value : e.valueFrom ? "<from source>" : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
                </Field>

                <Field label="Volume Mounts" full>
                  <ListBlock
                    items={
                      container.volumeMounts?.map(
                        (m) =>
                          `${m.name} → ${m.mountPath}${m.readOnly ? " (ro)" : ""}${m.subPath ? ` [${m.subPath}]` : ""}`
                      ) ?? []
                    }
                  />
                </Field>

                <Field label="Requests">
                  <ListBlock items={resources.requests.map(([k, v]) => `${k}: ${v}`)} />
                </Field>
                <Field label="Limits">
                  <ListBlock items={resources.limits.map(([k, v]) => `${k}: ${v}`)} />
                </Field>

                <Field label="Probes" full>
                  {!container.livenessProbe && !container.readinessProbe && !container.startupProbe ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <ul className="space-y-1">
                      <ProbeRow label="liveness" probe={container.livenessProbe} />
                      <ProbeRow label="readiness" probe={container.readinessProbe} />
                      <ProbeRow label="startup" probe={container.startupProbe} />
                    </ul>
                  )}
                </Field>

                <Field label="Image ID" full>
                  {status?.imageID ? (
                    <span className="font-mono text-xs break-all">{status.imageID}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Field>
                <Field label="Container ID" full>
                  {status?.containerID ? (
                    <span className="font-mono text-xs break-all">{status.containerID}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Field>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
