import { TRPCError } from "@trpc/server";

interface CanonicalIdentity {
  group: string;
  version: string;
  pluralName: string;
}

/**
 * Validates that a client-supplied resourceConfig's group/version/pluralName match
 * the canonical values for its kind. Workload-action procedures (scale, restart)
 * accept the kind via a Zod enum but still receive group/version/pluralName from the
 * client; without this check a caller could pass a valid kind while pointing the PATCH
 * at an arbitrary resource. Throws TRPCError BAD_REQUEST on any mismatch.
 */
export function assertCanonicalResourceConfig<Kind extends string>(
  resourceConfig: CanonicalIdentity & { kind: Kind },
  canonicalMap: Record<Kind, CanonicalIdentity>
): void {
  const canonical = canonicalMap[resourceConfig.kind];
  if (
    resourceConfig.group !== canonical.group ||
    resourceConfig.version !== canonical.version ||
    resourceConfig.pluralName !== canonical.pluralName
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `resourceConfig group/version/pluralName does not match the canonical values for kind "${resourceConfig.kind}"`,
    });
  }
}
