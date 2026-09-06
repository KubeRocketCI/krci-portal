import { krciStatus } from "@my-project/shared";
import type { LoadedResourceHealth } from "./statusSegments";

interface KrciStatusHolder {
  status?: { status?: string };
}

// One status enum for Codebase, CodebaseBranch, CDPipeline and Stage. Unmapped values count as unknown.
export function countKrciStatuses(items: readonly KrciStatusHolder[]): LoadedResourceHealth {
  return items.reduce<LoadedResourceHealth>(
    (acc, cur) => {
      switch (cur?.status?.status) {
        case krciStatus.created:
          acc.ok++;
          break;
        case krciStatus.initialized:
        case krciStatus.in_progress:
          acc.inProgress++;
          break;
        case krciStatus.failed:
          acc.error++;
          break;
        default:
          acc.unknown++;
          break;
      }

      acc.total++;

      return acc;
    },
    { total: 0, ok: 0, error: 0, inProgress: 0, cancelled: 0, unknown: 0 }
  );
}
