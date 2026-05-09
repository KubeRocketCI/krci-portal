import { EventListener, Trigger, GitServer, PipelineRun } from "@my-project/shared";
import { ResolutionStatus, ResolvedTriggerNode } from "@/modules/platform/tekton/hooks/useEventListenerTopology";

export type DrawerSelection =
  | { kind: "gitSource"; gitServer: GitServer | null }
  | { kind: "eventListener"; eventListener: EventListener }
  | { kind: "trigger"; triggerRef: string; resolved: Trigger | null; status: ResolutionStatus; namespace: string }
  | { kind: "interceptor"; interceptor: ResolvedTriggerNode["interceptors"][number]; namespace: string }
  | { kind: "triggerBinding"; binding: ResolvedTriggerNode["bindings"][number]; namespace: string }
  | { kind: "triggerTemplate"; template: ResolvedTriggerNode["template"]; namespace: string }
  | {
      kind: "pipeline";
      pipelineRef: ResolvedTriggerNode["template"]["pipelineRef"];
      latestPipelineRun: PipelineRun | null;
      namespace: string;
    };
