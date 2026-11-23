import { z } from "zod";
import {
  actorAgentSchema,
  actorCrashSchema,
  actorIssueSchema,
  actorPlacementSchema,
  actorRowSchema,
  actorSnapshotSchema,
  actorStateGroupSchema,
  actorStateSchema,
  atespaceSchema,
  attentionAgentSchema,
  attentionItemSchema,
  attentionKindSchema,
  attentionSeveritySchema,
  codebaseRefSchema,
  fleetSnapshotSchema,
  fleetSummarySchema,
  fleetUnreachableReasonSchema,
  roomSizeSchema,
  snapshotDurableStateSchema,
  snapshotFidelitySchema,
  substrateResourcesSchema,
  workerPoolAccessSchema,
  workerPoolResourceSchema,
  workerPoolRowSchema,
  workerRowSchema,
  workerStateSchema,
} from "./schemas.js";

export type ActorState = z.infer<typeof actorStateSchema>;
export type ActorStateGroup = z.infer<typeof actorStateGroupSchema>;
export type WorkerState = z.infer<typeof workerStateSchema>;
export type SnapshotFidelity = z.infer<typeof snapshotFidelitySchema>;
export type SnapshotDurableState = z.infer<typeof snapshotDurableStateSchema>;
export type FleetUnreachableReason = z.infer<typeof fleetUnreachableReasonSchema>;
export type WorkerPoolAccess = z.infer<typeof workerPoolAccessSchema>;
export type SubstrateResources = z.infer<typeof substrateResourcesSchema>;
export type Atespace = z.infer<typeof atespaceSchema>;
export type ActorIssue = z.infer<typeof actorIssueSchema>;
export type CodebaseRef = z.infer<typeof codebaseRefSchema>;
export type ActorAgent = z.infer<typeof actorAgentSchema>;
export type ActorPlacement = z.infer<typeof actorPlacementSchema>;
export type ActorCrash = z.infer<typeof actorCrashSchema>;
export type RoomSize = z.infer<typeof roomSizeSchema>;
export type ActorSnapshot = z.infer<typeof actorSnapshotSchema>;
export type ActorRow = z.infer<typeof actorRowSchema>;
export type WorkerRow = z.infer<typeof workerRowSchema>;
export type WorkerPoolResource = z.infer<typeof workerPoolResourceSchema>;
export type WorkerPoolRow = z.infer<typeof workerPoolRowSchema>;
export type FleetSummary = z.infer<typeof fleetSummarySchema>;
export type AttentionSeverity = z.infer<typeof attentionSeveritySchema>;
export type AttentionKind = z.infer<typeof attentionKindSchema>;
export type AttentionAgent = z.infer<typeof attentionAgentSchema>;
export type AttentionItem = z.infer<typeof attentionItemSchema>;
export type FleetSnapshot = z.infer<typeof fleetSnapshotSchema>;
export type ReadyFleetSnapshot = Extract<FleetSnapshot, { state: "ready" }>;
