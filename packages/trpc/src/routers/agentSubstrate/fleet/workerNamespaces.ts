/**
 * Namespaces whose WorkerPools are listed even with no Worker in them: the Agent Substrate install puts its
 * worker pools in `krci-agents`. A WorkerPool whose pods are not scheduled has no Worker, so only this list finds it.
 */
export const WORKER_NAMESPACES: readonly string[] = ["krci-agents"];
