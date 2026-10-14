import { z } from "zod";
import { validateCELFilter } from "@my-project/shared";

/**
 * Zod schemas for Tekton / Kubernetes input validation, shared across routers
 * (`tektonResults`, `pipelineRun`, …). Constraining to valid Kubernetes / UUID
 * characters prevents CEL injection when values are interpolated into filter
 * expressions and bounds the surface accepted at the tRPC boundary.
 */
export const tektonInputSchemas = {
  /** RFC 1123 DNS label: lowercase alphanumeric + hyphens, 1-253 chars */
  k8sName: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Invalid Kubernetes resource name"),
  /** K8s namespace: same as DNS label */
  namespace: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Invalid namespace"),
  /** UUID v4 format */
  uuid: z.string().uuid("Invalid UUID"),
  /** Step name: lowercase alphanumeric + hyphens, max 63 chars (K8s container name limit) */
  stepName: z
    .string()
    .max(63)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Invalid step name"),
  /**
   * Tekton param name. Tekton's CRD enforces `^[A-Za-z_][A-Za-z0-9_-]*$` for
   * param *definitions*, but pipelines defined elsewhere (Helm-style configs,
   * ArgoCD application params) routinely use dot-separated names like
   * `chart.version` or `image.tag` for user-supplied overrides at
   * `pipelineRun.spec.params[].name`, which the apiserver does not re-validate
   * against the definition pattern. Allow `.` and `/` so override keys are not
   * rejected here. Capped at 253 chars to bound input size at the boundary.
   */
  paramName: z
    .string()
    .max(253)
    .regex(/^[A-Za-z_][A-Za-z0-9_./-]*$/, "Invalid param name"),
  /**
   * K8s label key: optional DNS-subdomain prefix + name segment (≤63 chars,
   * alphanumeric edges, dots/hyphens/underscores allowed). Defense-in-depth
   * against unconstrained record keys reaching K8s metadata.
   */
  k8sLabelKey: z
    .string()
    .regex(
      /^([a-z0-9]([-a-z0-9.]{0,251}[a-z0-9])?\/)?[A-Za-z0-9]([-A-Za-z0-9_.]{0,61}[A-Za-z0-9])?$/,
      "Invalid label key"
    ),
  /**
   * K8s label value: ≤63 chars, alphanumeric edges, dots/hyphens/underscores.
   * Empty string is valid per K8s.
   */
  k8sLabelValue: z.string().regex(/^([A-Za-z0-9]([-A-Za-z0-9_.]{0,61}[A-Za-z0-9])?)?$/, "Invalid label value"),
  /**
   * CEL filter sent to Tekton Results, validated by the shared `validateCELFilter`.
   * Tekton Results feeds the filter to cel2sql unescaped, so a quote inside a
   * string literal is a SQL-injection vector. Empty and undefined pass; length
   * limit is `CEL_FILTER_MAX_LENGTH`.
   */
  celFilter: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (val === undefined) return;
      const result = validateCELFilter(val);
      if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${result.message} (position ${result.position})`,
        });
      }
    }),
} as const;
