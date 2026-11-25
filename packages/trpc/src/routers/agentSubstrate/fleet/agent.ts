import { latestSnapshot, type AgentActor, type AgentRead, type AgentResult } from "@my-project/shared";
import type {
  AgentSubstrateSource,
  SubstrateActor,
  SubstrateActorTemplate,
  SubstrateObjectRef,
} from "../../../clients/agentSubstrate/index.js";
import { K8sClient } from "../../../clients/k8s/index.js";
import type { TRPCContext } from "../../../context/types.js";
import { codebaseNamespace, readCodebaseLinks, withCodebase } from "./codebaseLinks.js";
import { roomSizeOf } from "./room.js";
import { AGENT_ENV, agentContainerOf, agentOfEnv, asSourceError, unreachableReasonOf } from "./substrateRead.js";

/** The dispatcher names the branch of an issue `agent/issue-<iid>`. */
const ISSUE_BRANCH_PREFIX = "agent/issue-";

/** Null unless a positive safe integer in decimal digits. */
function turnLimitOf(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const turnLimit = Number(value);
  return Number.isSafeInteger(turnLimit) ? turnLimit : null;
}

function toAgentActor(actor: SubstrateActor, actorTemplate: SubstrateActorTemplate): AgentActor {
  const assignment = actor.workerAssignment;
  const newest = latestSnapshot(actor.snapshots);
  return {
    atespace: actor.atespace,
    name: actor.name,
    uid: actor.uid,
    state: actor.state,
    actorTemplate: actor.actorTemplate.name,
    size: roomSizeOf([actorTemplate.limits]),
    workerSelector: { ...actorTemplate.workerSelector },
    placement: assignment && {
      worker: assignment.worker,
      workerPool: assignment.workerPool,
      workerNamespace: assignment.workerNamespace,
      workerPod: assignment.workerPod,
      node: assignment.nodeName,
      sandboxRuntime: assignment.sandboxRuntime,
    },
    crash: actor.crash && { message: actor.crash.message, at: actor.crash.crashTime },
    preferredSnapshotFidelity: actorTemplate.preferredSnapshotFidelity,
    newestSnapshot: newest && {
      generation: newest.generation,
      fidelity: newest.fidelity,
      sandboxClass: newest.sandboxClass,
    },
    createdAt: actor.createTime,
    updatedAt: actor.updateTime,
  };
}

/** Null when the actor template is gone. */
async function actorTemplateOf(
  source: AgentSubstrateSource,
  ref: SubstrateObjectRef
): Promise<SubstrateActorTemplate | null> {
  try {
    return await source.getActorTemplate(ref);
  } catch (error) {
    if (asSourceError(error).kind === "notFound") return null;
    throw error;
  }
}

type SubstrateAgentRead =
  | { kind: "actorNotFound" }
  | { kind: "notAnAgent" }
  | { kind: "agent"; actor: SubstrateActor; actorTemplate: SubstrateActorTemplate };

async function readAgent(source: AgentSubstrateSource, ref: SubstrateObjectRef): Promise<SubstrateAgentRead> {
  let actor: SubstrateActor;
  try {
    actor = await source.getActor(ref);
  } catch (error) {
    if (asSourceError(error).kind === "notFound") return { kind: "actorNotFound" };
    throw error;
  }
  const actorTemplate = await actorTemplateOf(source, actor.actorTemplate);
  return actorTemplate ? { kind: "agent", actor, actorTemplate } : { kind: "notAnAgent" };
}

/**
 * Reads one actor and its actor template with the portal ServiceAccount, uncached; no worker read. Reads the Codebase
 * of the agent with the user's `idToken`, as the fleet does. Passes on only the AGENT_ENV values (ADR 0001).
 */
export async function getAgent(ctx: TRPCContext, ref: SubstrateObjectRef): Promise<AgentRead> {
  if (!ctx.agentSubstrateSource) {
    return { state: "notConfigured" };
  }

  const readAt = new Date().toISOString();
  let read: SubstrateAgentRead;
  try {
    read = await readAgent(ctx.agentSubstrateSource, ref);
  } catch (error) {
    return { state: "unreachable", reason: unreachableReasonOf(error, "Agent") };
  }

  const ready = (result: AgentResult): AgentRead => ({ state: "ready", updatedAt: readAt, result });
  if (read.kind !== "agent") return ready({ kind: read.kind });

  const { actor, actorTemplate } = read;
  const container = agentContainerOf(actorTemplate);
  if (!container) return ready({ kind: "notAnAgent" });
  const agent = agentOfEnv(container.env);

  const namespace = codebaseNamespace();
  const codebaseLinks = await readCodebaseLinks(
    namespace ? new K8sClient(ctx.session) : null,
    namespace,
    new Set([agent.issue.projectPath])
  );

  return ready({
    kind: "agent",
    agent: withCodebase(
      {
        ...agent,
        issueBranch: `${ISSUE_BRANCH_PREFIX}${agent.issue.iid}`,
        turnLimit: turnLimitOf(container.env.get(AGENT_ENV.turnLimit)),
        agentImage: container.image || null,
      },
      codebaseLinks
    ),
    actor: toAgentActor(actor, actorTemplate),
  });
}
