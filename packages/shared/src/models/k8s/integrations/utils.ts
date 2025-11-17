import { produce, Draft } from "immer";
import { z } from "zod";
import { Secret } from "../groups/Core/index.js";
import {
  SECRET_ANNOTATION_CLUSTER_CONNECTED,
  SECRET_ANNOTATION_CLUSTER_ERROR,
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR,
} from "./constants.js";

export const getIntegrationSecretStatus = (
  integrationSecret: Secret
): {
  connected: string | undefined;
  statusError: string | undefined;
} => {
  const connected = integrationSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED];
  const statusError = integrationSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR];

  return {
    connected,
    statusError,
  };
};

export const getClusterSecretStatus = (
  clusterSecret: Secret
): {
  connected: string | undefined;
  statusError: string | undefined;
} => {
  const connected = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_CONNECTED];
  const statusError = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_ERROR];

  return {
    connected,
    statusError,
  };
};

/**
 * Generic utility to edit Kubernetes resources using immer
 * @param existingResource - The current resource from the cluster
 * @param input - The input data to validate and apply
 * @param inputSchema - Zod schema to validate the input
 * @param updater - Function that applies the changes using immer draft
 * @returns The updated resource
 */
export const editResource = <T, U>(
  existingResource: T,
  input: U,
  inputSchema: z.ZodSchema<U>,
  updater: (draft: Draft<T>, validatedInput: U) => void
): T => {
  // Validate input
  const validatedInput = inputSchema.parse(input);

  // Apply updates using immer
  return produce(existingResource, (draft) => {
    // Apply user-defined updates
    updater(draft, validatedInput);
  });
};
