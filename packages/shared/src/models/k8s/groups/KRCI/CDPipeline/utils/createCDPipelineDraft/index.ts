import { ZodError } from "zod";
import { k8sCDPipelineConfig } from "../../constants";
import { CDPipelineDraft, CreateCDPipelineDraftInput } from "../../types";
import { cdPipelineDraftSchema, createCDPipelineDraftInputSchema } from "../../schema";

const { kind, apiVersion } = k8sCDPipelineConfig;

export const createCDPipelineDraftObject = (input: CreateCDPipelineDraftInput): CDPipelineDraft => {
  const parsedInput = createCDPipelineDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: CDPipelineDraft = {
    apiVersion,
    kind,
    metadata: {
      name: input.name || "your cd pipeline name",
    },
    spec: {
      applications: input.applications,
      applicationsToPromote: input.applicationsToPromote,
      deploymentType: input.deploymentType,
      description: input.description,
      inputDockerStreams: input.inputDockerStreams,
      name: input.name,
    },
  };

  const parsedDraft = cdPipelineDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
