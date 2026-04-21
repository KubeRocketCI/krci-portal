import { z } from "zod";

/**
 * Wraps a Zod schema with a refinement that rejects objects where both
 * `pullRequest` and `branch` are present. The two fields are mutually
 * exclusive at the SonarQube API layer.
 *
 * The error is attached to the `branch` path so form libraries surface it
 * on the correct field.
 */
export function withScopeMutuallyExclusive<TOutput extends { pullRequest?: string; branch?: string }>(
  schema: z.ZodType<TOutput>
) {
  return schema.refine((v) => !(v.pullRequest && v.branch), {
    message: "pullRequest and branch are mutually exclusive",
    path: ["branch"],
  });
}
