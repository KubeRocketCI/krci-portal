import { z } from "zod";
import type { TRPCMutationProcedure } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import { capitalizeFirstLetter } from "@my-project/shared";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { protectedProcedure } from "../../../../../../procedures/protected/index.js";
import { getInitializedK8sClient } from "../../../../utils/getInitializedK8sClient/index.js";
import { handleK8sError } from "../../../../utils/handleK8sError/index.js";

export const integrationModeSchema = z.enum(["create", "edit"]);

export type IntegrationMode = z.infer<typeof integrationModeSchema>;

/**
 * The three fields every manage*Integration input opens with. `clusterName` is the
 * repo-wide client cache-key field; the server does not read it.
 */
export const integrationInputBaseSchema = z.object({
  clusterName: z.string(),
  namespace: z.string(),
  mode: integrationModeSchema,
});

export type IntegrationInput = {
  namespace: string;
  mode: IntegrationMode;
  dirtyFields: Record<string, boolean>;
};

/** `currentResource` is the live object the edit path patches. */
export type IntegrationResourceSlice = { currentResource?: unknown };

/** Field names that are at once an input slice, a `dirtyFields` flag and a result key. */
export type IntegrationStepKey<TInput extends IntegrationInput> = Extract<
  {
    [K in keyof TInput]: K extends keyof TInput["dirtyFields"]
      ? NonNullable<TInput[K]> extends IntegrationResourceSlice
        ? K
        : never
      : never;
  }[keyof TInput],
  string
>;

type IntegrationStepBase<TInput extends IntegrationInput, TKey extends string, TSlice, TResource> = {
  /** Names the input slice, the `dirtyFields` flag, the result key and the error text. */
  key: TKey;
  resourceConfig: K8sResourceConfig;
  edit: (currentResource: TResource, slice: TSlice, input: TInput) => TResource;
};

/** A step creates as well as edits when it declares `createDraft`, and is edit-only otherwise. */
export type IntegrationStep<
  TInput extends IntegrationInput,
  TKey extends IntegrationStepKey<TInput> = IntegrationStepKey<TInput>,
  TSlice = NonNullable<TInput[TKey]>,
  TResource = KubeObjectBase,
> =
  | (IntegrationStepBase<TInput, TKey, TSlice, TResource> & {
      createDraft: (slice: TSlice, input: TInput) => TResource;
      /** Default "mode". "currentResource" creates whenever the slice carries no live resource. */
      branchOn?: "mode" | "currentResource";
      skipInCreateMode?: never;
    })
  | (IntegrationStepBase<TInput, TKey, TSlice, TResource> & {
      createDraft?: never;
      branchOn?: never;
      /** Skips the step in create mode even when the slice is present and dirty. */
      skipInCreateMode?: boolean;
    });

// Distributes over the keys so each member carries its own slice type; a single member with
// a widened slice would erase createDraft/edit parameter checking at every call site.
// The resource stays `any`: parameters are contravariant, so a shared supertype would reject
// each step's own edit signature.
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyIntegrationStep<TInput extends IntegrationInput> = {
  [K in IntegrationStepKey<TInput>]: IntegrationStep<TInput, K, NonNullable<TInput[K]>, any>;
}[IntegrationStepKey<TInput>];
/* eslint-enable @typescript-eslint/no-explicit-any */

type IntegrationResult<TSteps extends readonly { key: string }[]> = {
  success: true;
  data: Record<TSteps[number]["key"], KubeObjectBase | undefined> & { message: string };
};

/**
 * Builds a manage*Integration mutation from a list of resource steps.
 *
 * Steps run in array order and fail fast: the first rejection aborts the rest and
 * earlier writes are left in place (no rollback). A step is skipped when its
 * `dirtyFields` flag is false or its input slice is absent.
 */
export function createManageIntegrationProcedure<
  TSchema extends z.ZodType<IntegrationInput>,
  const TSteps extends readonly AnyIntegrationStep<z.infer<TSchema>>[],
>(config: {
  inputSchema: TSchema;
  /** Mid-sentence casing. Appended to the success message; capitalized to open the error log. */
  label: string;
  steps: TSteps;
}): TRPCMutationProcedure<{
  input: z.input<TSchema>;
  output: IntegrationResult<TSteps>;
  meta: OpenApiMeta;
}> {
  return protectedProcedure
    .input(config.inputSchema)
    .mutation(async ({ input, ctx }): Promise<IntegrationResult<TSteps>> => {
      const k8sClient = getInitializedK8sClient(ctx);
      const { namespace, mode, dirtyFields } = input;

      type ResultKey = TSteps[number]["key"];
      const written = Object.fromEntries(config.steps.map((step) => [step.key, undefined])) as Record<
        ResultKey,
        KubeObjectBase | undefined
      >;

      try {
        for (const step of config.steps) {
          const slice = input[step.key] as IntegrationResourceSlice | undefined;

          if (!dirtyFields[step.key] || !slice) {
            continue;
          }

          if (step.createDraft) {
            const create = step.branchOn === "currentResource" ? !slice.currentResource : mode === "create";

            if (create) {
              written[step.key as ResultKey] = await k8sClient.createResource(
                step.resourceConfig,
                namespace,
                step.createDraft(slice as never, input) as object
              );
              continue;
            }
          } else if (step.skipInCreateMode && mode === "create") {
            continue;
          }

          if (!slice.currentResource) {
            throw new Error(`currentResource is required to edit ${step.key}`);
          }

          const edited = step.edit(slice.currentResource, slice as never, input) as KubeObjectBase;
          written[step.key as ResultKey] = await k8sClient.replaceResource(
            step.resourceConfig,
            edited.metadata.name,
            namespace,
            edited
          );
        }
      } catch (error) {
        console.error(`${capitalizeFirstLetter(config.label)} operation failed:`, error);
        throw handleK8sError(error);
      }

      return {
        success: true,
        data: {
          ...written,
          message: `Successfully ${mode === "create" ? "created" : "updated"} ${config.label}`,
        },
      };
    });
}
