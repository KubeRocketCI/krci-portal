import {
  createPipelineRunDraftFromPipeline,
  k8sPipelineConfig,
  k8sPipelineRunConfig,
  k8sTriggerTemplateConfig,
  type Pipeline,
  type PipelineRun,
  type TriggerTemplate,
} from "@my-project/shared";
import { pipelineRunStartRowSchema } from "../../../../schemas/pipelineRunStartRow.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../k8s/errors/index.js";
import { handleK8sError } from "../../../k8s/utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { tektonInputSchemas } from "../../../../schemas/tektonInput.js";
import { getTriggerTemplateLabel, prepareStartDraft, projectPipelineRunRow } from "../../helpers.js";
import { getResourceOrThrowNotFound } from "../../lookup.js";

const startInputSchema = z
  .object({
    namespace: tektonInputSchemas.namespace,
    pipeline: tektonInputSchemas.k8sName,
    params: z.record(tektonInputSchemas.paramName, z.string()).optional(),
    labels: z.record(tektonInputSchemas.k8sLabelKey, tektonInputSchemas.k8sLabelValue).optional(),
    dryRun: z.boolean().optional().default(false),
  })
  .strict();

/**
 * Discriminated by `kind`:
 *   - `created` — apiserver assigned a name; `row` carries the projected list
 *     entry.
 *   - `dryRun` — no resource was created; `manifest` is the rendered PipelineRun
 *     resource as a JSON object (not a serialised string — consumers parse
 *     once at the transport layer).
 */
const manifestSchema = z.record(z.string(), z.unknown());

const startOutputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("created"), row: pipelineRunStartRowSchema }).strict(),
  z.object({ kind: z.literal("dryRun"), manifest: manifestSchema }).strict(),
]);

export const pipelineRunStartProcedure = protectedProcedure
  .meta({ openapi: { method: "POST", path: "/v1/pipelineruns/start", protect: true, tags: ["pipelinerun"] } })
  .input(startInputSchema)
  .output(startOutputSchema)
  .mutation(async ({ input, ctx }): Promise<z.infer<typeof startOutputSchema>> => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const pipeline = await getResourceOrThrowNotFound<Pipeline>(
      () => k8sClient.getResource(k8sPipelineConfig, input.pipeline, input.namespace) as Promise<Pipeline>,
      `pipeline '${input.pipeline}' not found`,
      "pipeline_not_found"
    );

    let triggerTemplate: TriggerTemplate | undefined;
    const ttLabel = getTriggerTemplateLabel(pipeline);
    if (ttLabel) {
      // Defense-in-depth: the apiserver will reject a malformed name, but
      // validating locally turns a typo'd label into a fast BAD_REQUEST instead
      // of a network round-trip with an opaque K8s error.
      const ttLabelCheck = tektonInputSchemas.k8sName.safeParse(ttLabel);
      if (!ttLabelCheck.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `pipeline '${input.pipeline}' has malformed TriggerTemplate label`,
          cause: { source: "validation" as const, reason: "malformed_trigger_template_label" },
        });
      }

      triggerTemplate = await getResourceOrThrowNotFound<TriggerTemplate>(
        () => k8sClient.getResource(k8sTriggerTemplateConfig, ttLabel, input.namespace) as Promise<TriggerTemplate>,
        `pipeline '${input.pipeline}' references a TriggerTemplate that does not exist`,
        "trigger_template_not_found"
      );
    }

    // createPipelineRunDraftFromPipeline always returns a draft: the TT path
    // gracefully falls through to a minimal builder when the TriggerTemplate
    // is missing resourcetemplates.
    const baseDraft = createPipelineRunDraftFromPipeline(triggerTemplate, pipeline);
    const draft = prepareStartDraft(baseDraft, input.pipeline, input.namespace, input.params, input.labels);

    // Return the resource as an object so transport layers (tRPC + Fastify)
    // serialise it once and consumers don't pay a double-parse tax. The CLI
    // can then re-encode as YAML for `kubectl apply -f -` or pass through as
    // JSON for AI-agent consumers.
    if (input.dryRun) {
      return {
        kind: "dryRun",
        manifest: draft as Record<string, unknown>,
      };
    }

    let created: PipelineRun;
    try {
      created = (await k8sClient.createResource(k8sPipelineRunConfig, input.namespace, draft)) as PipelineRun;
    } catch (error) {
      throw handleK8sError(error);
    }

    return {
      kind: "created",
      row: projectPipelineRunRow(created),
    };
  });
