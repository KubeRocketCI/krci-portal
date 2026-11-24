import type { CodebaseScanLevel, RuntimeContainer, RuntimeEnvironment, ScanRef } from "@my-project/shared";
import type { RunningContainer, SecurityFindingsFocus } from "./types";

export function environmentLabel({ cdPipeline, stage }: Pick<RuntimeEnvironment, "cdPipeline" | "stage">): string {
  return `${cdPipeline} / ${stage}`;
}

export function containerLabel(
  environment: Pick<RuntimeEnvironment, "cdPipeline" | "stage">,
  { container }: Pick<RuntimeContainer, "container">
): string {
  return `${container} in ${environmentLabel(environment)}`;
}

export function containerTestUrl({
  vulnerabilities,
  secrets,
}: Pick<RunningContainer, "vulnerabilities" | "secrets">): string | undefined {
  return (vulnerabilities ?? secrets)?.testUrl;
}

export function isFocusedEnvironment(
  environment: Pick<RuntimeEnvironment, "cdPipeline" | "stage">,
  focus: SecurityFindingsFocus | null
): boolean {
  return !!focus && environment.cdPipeline === focus.cdPipeline && environment.stage === focus.stage;
}

/** Columns of the findings table of a scan: a place in the source, or a component and a fix. */
export function findingsLayout(ref: ScanRef): CodebaseScanLevel {
  if (ref.level === "runtime") {
    return ref.reportKind === "exposedsecretreport" ? "code" : "image";
  }
  return ref.level;
}
