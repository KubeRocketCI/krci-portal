import {
  BUILD_MANAGED_PARAM_NAMES,
  codebaseBranchStatus,
  isPipelineRunBlocking,
  k8sPipelineRunConfig,
  pipelineRunLabels,
  pipelineType,
  type PipelineRun,
} from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { startOutputSchema } from "../../../../schemas/pipelineRunStartOutput.js";
import { tektonInputSchemas } from "../../../../schemas/tektonInput.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../k8s/errors/index.js";
import { handleK8sError } from "../../../k8s/utils/handleK8sError/index.js";
import { mergeDraftParams, projectPipelineRunRow, withGenerateName } from "../../helpers.js";
import { listCompleteOrThrow } from "../../lookup.js";
import { resolveBuildDraft } from "../../resolveBuild.js";

const MANAGED_PARAM_NAMES: ReadonlySet<string> = new Set(BUILD_MANAGED_PARAM_NAMES);

const buildInputSchema = z
  .object({
    namespace: tektonInputSchemas.namespace,
    codebase: tektonInputSchemas.k8sName,
    // Git branch name, not a Kubernetes name: `/` is legal and common.
    branch: z.string().min(1).max(253).optional(),
    // Read by CLI pre-validation to reject a managed --param locally.
    params: z
      .record(tektonInputSchemas.paramName, z.string())
      .openapi({ "x-krci-managed-params": [...BUILD_MANAGED_PARAM_NAMES] })
      .optional(),
    dryRun: z.boolean().optional().default(false),
  })
  .strict();

export const pipelineRunBuildProcedure = protectedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/v1/pipelineruns/build",
      protect: true,
      tags: ["pipelinerun"],
      // Statuses this procedure raises itself; K8s API failures pass through
      // handleK8sError with their own status and are not listed.
      // trpc-to-openapi's POST default omits 404 and 409.
      errorResponses: [400, 401, 403, 404, 409, 500],
    },
  })
  .input(buildInputSchema)
  .output(startOutputSchema)
  .mutation(async ({ input, ctx }): Promise<z.infer<typeof startOutputSchema>> => {
    // Checked before any K8s call. These params are the project identity this
    // verb resolves; an override would build another codebase or branch with
    // no error. `pipelineRun.start` accepts raw params.
    const managedParam = Object.keys(input.params ?? {}).find((name) => MANAGED_PARAM_NAMES.has(name));

    if (managedParam) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `param '${managedParam}' is derived from the codebase and branch and cannot be overridden`,
        cause: { source: "validation" as const, reason: "managed_param_override" },
      });
    }

    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { draft: baseDraft, codebaseBranch } = await resolveBuildDraft(k8sClient, {
      namespace: input.namespace,
      codebase: input.codebase,
      branch: input.branch,
    });

    // The builder sets a client-side random suffix for the UI. Here the apiserver
    // assigns the suffix via generateName, as the webhook TriggerTemplate and
    // `pipelineRun.start` do.
    const draft = mergeDraftParams(
      withGenerateName(baseDraft, `build-${codebaseBranch.metadata.name}-`, input.namespace),
      input.params
    ) as unknown as Record<string, unknown>;

    // Preconditions gate the create path only: a dry run renders even for a
    // branch that is not ready or already building.
    if (input.dryRun) {
      return {
        kind: "dryRun",
        manifest: draft,
      };
    }

    if (codebaseBranch.status?.status !== codebaseBranchStatus.created) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `branch '${codebaseBranch.spec.branchName}' of codebase '${input.codebase}' is not ready`,
        cause: { source: "validation" as const, reason: "codebase_branch_not_ready" },
      });
    }

    // Any blocking build run of this branch refuses the create; the UI's Build
    // button checks only the latest run. List-then-create: two concurrent
    // callers can both pass. Nothing in the platform serialises builds per branch.
    const branchRuns = await listCompleteOrThrow<PipelineRun>(
      k8sClient,
      k8sPipelineRunConfig,
      input.namespace,
      `${pipelineRunLabels.pipelineType}=${pipelineType.build},` +
        `${pipelineRunLabels.codebaseBranch}=${codebaseBranch.metadata.name}`
    );

    if (branchRuns.some((run) => isPipelineRunBlocking(run))) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `a build is already running for branch '${codebaseBranch.spec.branchName}' of codebase '${input.codebase}'`,
        cause: { source: "validation" as const, reason: "build_in_progress" },
      });
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
