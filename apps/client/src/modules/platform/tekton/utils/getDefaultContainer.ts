import type { Pod } from "@my-project/shared";

/**
 * Find the default container name for a given step in a Tekton pod.
 * Matches by checking if the container name includes the step name.
 */
export function getDefaultContainer(pod: Pod, stepName: string): string | undefined {
  return pod?.spec?.containers.find((container) => container.name.includes(stepName))?.name;
}
