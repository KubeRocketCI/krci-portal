import { z } from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../core";
import { secretDraftSchema, secretSchema } from "../../default";
import { codemieSecretLabels } from "./constants";

export const codemieSecretRefSchema = z.object({
  clientKey: z.string(),
  name: z.string(),
  secretKey: z.string(),
});

export const codemieOidcSchema = z.object({
  secretRef: codemieSecretRefSchema,
  tokenEndpoint: z.string().url(),
});

export const codemieSpecSchema = z.object({
  oidc: codemieOidcSchema,
  url: z.string().url(),
});

export const codemieStatusSchema = z.object({
  connected: z.boolean().optional(),
  error: z.string().optional(),
  user: z.string().optional(),
});

export const codemieSchema = kubeObjectBaseSchema.extend({
  spec: codemieSpecSchema,
  status: codemieStatusSchema.optional(),
});

export const codemieDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: codemieSpecSchema,
});

export const createCodemieDraftInputSchema = z.object({
  name: z.string(),
  tokenEndpoint: z.string(),
  apiUrl: z.string(),
});

export const codemieSecretSchema = secretSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: z.object({
      [codemieSecretLabels.secretType]: z.string(),
    }),
  }),
  data: z.object({
    client_id: z.string(),
    client_secret: z.string(),
  }),
});

export const codemieDraftSecretSchema = secretDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    labels: z.object({
      [codemieSecretLabels.secretType]: z.string(),
    }),
  }),
  data: z.object({
    client_id: z.string(),
    client_secret: z.string(),
  }),
});

export const createCodemieDraftSecretInputSchema = z.object({
  name: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
});
