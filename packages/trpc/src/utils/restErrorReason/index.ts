/**
 * Public `error.reason` tags of the `sendRestError` envelope.
 *
 * Client-visible: add a tag only when it is intended public API. A
 * `cause.reason` outside this list is dropped. Published in the OpenAPI
 * document as `x-krci-reasons`; the krci CLI keys on these values
 * (`cli/internal/portal/start.go`, `build.go`).
 * The SCA 404 body (`sendResolveBranchFailure`) has its own tags.
 */
export const REST_ERROR_REASONS = [
  "branch_not_specified",
  "build_in_progress",
  "build_pipeline_not_configured",
  "build_template_misconfigured",
  "codebase_branch_ambiguous",
  "codebase_branch_not_found",
  "codebase_branch_not_ready",
  "codebase_not_found",
  "git_server_not_found",
  "gitlab_ci_not_supported",
  "list_truncated",
  "malformed_trigger_template_label",
  "managed_param_override",
  "pipeline_not_found",
  "trigger_template_not_found",
] as const;

export type RestErrorReason = (typeof REST_ERROR_REASONS)[number];

/** `TRPCError` cause for a request rejected by a procedure's own checks. */
export function validationCause(reason: RestErrorReason) {
  return { source: "validation" as const, reason };
}

/**
 * Canonical tag for an untrusted `cause.reason`, or `undefined`.
 *
 * Returns literals, never the input value. Each case must match an entry of
 * `REST_ERROR_REASONS`; the unit test enforces it.
 */
export function toRestErrorReason(value: unknown): RestErrorReason | undefined {
  switch (value) {
    case "branch_not_specified":
      return "branch_not_specified";
    case "build_in_progress":
      return "build_in_progress";
    case "build_pipeline_not_configured":
      return "build_pipeline_not_configured";
    case "build_template_misconfigured":
      return "build_template_misconfigured";
    case "codebase_branch_ambiguous":
      return "codebase_branch_ambiguous";
    case "codebase_branch_not_found":
      return "codebase_branch_not_found";
    case "codebase_branch_not_ready":
      return "codebase_branch_not_ready";
    case "codebase_not_found":
      return "codebase_not_found";
    case "git_server_not_found":
      return "git_server_not_found";
    case "gitlab_ci_not_supported":
      return "gitlab_ci_not_supported";
    case "list_truncated":
      return "list_truncated";
    case "malformed_trigger_template_label":
      return "malformed_trigger_template_label";
    case "managed_param_override":
      return "managed_param_override";
    case "pipeline_not_found":
      return "pipeline_not_found";
    case "trigger_template_not_found":
      return "trigger_template_not_found";
    default:
      return undefined;
  }
}
