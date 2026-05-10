import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import type { Pod } from "@my-project/shared";

type RawVolume = Record<string, unknown> & { name?: string };

const VOLUME_KINDS = [
  "configMap",
  "secret",
  "emptyDir",
  "persistentVolumeClaim",
  "hostPath",
  "projected",
  "downwardAPI",
  "nfs",
  "csi",
  "ephemeral",
] as const;

type VolumeKind = (typeof VOLUME_KINDS)[number] | "unknown";

function detectKind(volume: RawVolume): VolumeKind {
  for (const k of VOLUME_KINDS) {
    if (k in volume && volume[k] !== undefined) return k;
  }
  return "unknown";
}

function detectDetail(volume: RawVolume, kind: VolumeKind): string {
  const v = volume as Record<string, Record<string, unknown> | undefined>;
  switch (kind) {
    case "configMap":
      return (v.configMap?.name as string) ?? "";
    case "secret":
      return (v.secret?.secretName as string) ?? "";
    case "persistentVolumeClaim":
      return (v.persistentVolumeClaim?.claimName as string) ?? "";
    case "hostPath":
      return (v.hostPath?.path as string) ?? "";
    case "csi":
      return (v.csi?.driver as string) ?? "";
    case "nfs":
      return `${(v.nfs?.server as string) ?? ""}:${(v.nfs?.path as string) ?? ""}`;
    default:
      return "";
  }
}

export function VolumesTab({ pod }: { pod: Pod }) {
  const volumes = ((pod.spec?.volumes as RawVolume[] | undefined) ?? []).filter(Boolean);
  const containers = [...(pod.spec?.initContainers ?? []), ...(pod.spec?.containers ?? [])];

  if (volumes.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">No volumes mounted.</div>;
  }

  const mountsByVolume = new Map<string, Array<{ container: string; mountPath: string; readOnly?: boolean }>>();
  for (const c of containers) {
    for (const m of c.volumeMounts ?? []) {
      const arr = mountsByVolume.get(m.name) ?? [];
      arr.push({ container: c.name, mountPath: m.mountPath, readOnly: m.readOnly });
      mountsByVolume.set(m.name, arr);
    }
  }

  return (
    <div className="p-4">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground text-left text-xs uppercase">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">Mounts</th>
          </tr>
        </thead>
        <tbody>
          {volumes.map((v, i) => {
            const kind = detectKind(v);
            const detail = detectDetail(v, kind);
            const name = v.name ?? `volume-${i}`;
            const mounts = mountsByVolume.get(name) ?? [];
            return (
              <tr key={name} className="border-t align-top">
                <td className="px-3 py-2 font-mono text-xs">{name}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="text-[10px]">
                    {kind}
                  </Badge>
                </td>
                <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                  {detail ? (
                    <Tooltip title={detail}>
                      <span className="block max-w-[280px] truncate">{detail}</span>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {mounts.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <ul className="space-y-1 font-mono text-xs">
                      {mounts.map((m, mi) => (
                        <li key={mi}>
                          <span className="text-foreground">{m.container}</span>:{m.mountPath}
                          {m.readOnly && <span className="text-muted-foreground"> (ro)</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
