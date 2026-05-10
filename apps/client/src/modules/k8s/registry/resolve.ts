import type { ResourceDescriptor, ResourceRegistry } from "./types";

export function resolveDescriptor(registry: ResourceRegistry, kind: string): ResourceDescriptor | null {
  return registry[kind] ?? null;
}
