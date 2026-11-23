import { CircleAlert, CircleCheck } from "lucide-react";
import type { WorkerPoolResource, WorkerState } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { WORKER_STATE_ICON } from "../../constants/workerState";
import { StateBadge } from "../StateBadge";

export function WorkerStateBadge({ state }: { state: WorkerState }) {
  return <StateBadge label={state} icon={WORKER_STATE_ICON[state]} />;
}

const READY_ICON = { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
const NOT_READY_ICON = { component: CircleAlert, color: STATUS_COLOR.MISSING };

export function WorkerNotRegisteredBadge() {
  return <StateBadge label="not registered" icon={NOT_READY_ICON} />;
}

export function WorkerPoolReadyBadge({ resource }: { resource: WorkerPoolResource }) {
  const { readyReplicas, desiredReplicas } = resource;
  return (
    <StateBadge
      label={`${readyReplicas}/${desiredReplicas} ready`}
      icon={readyReplicas === desiredReplicas ? READY_ICON : NOT_READY_ICON}
    />
  );
}
