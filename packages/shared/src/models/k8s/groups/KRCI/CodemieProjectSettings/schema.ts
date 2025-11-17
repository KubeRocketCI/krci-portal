import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../common/index.js";

const secretRefSchema = z.object({
  name: z.string(),
  secretKey: z.string(),
});

const sourceRefSchema = z.object({
  secretRef: secretRefSchema,
});

const keyValueSchema = z.object({
  key: z.string(),
  value: z.string().optional(),
  sourceRef: sourceRefSchema.optional(),
});

const gitCredentialSchema = z.object({
  secretRef: secretRefSchema,
  tokenName: z.string(),
  url: z.string(),
});

const codemieRefSchema = z.object({
  kind: z.string().default("Codemie").optional(),
  name: z.string(),
});

export const codemieProjectSettingsSpecSchema = z.object({
  alias: z.string(),
  codemieRef: codemieRefSchema,
  credentialValues: z.array(keyValueSchema).nullable().optional(),
  gitCredential: gitCredentialSchema.optional(),
  projectName: z.string(),
  type: z.string(),
});

export const codemieProjectSettingsStatusEnum = z.enum(["created", "error"]);

export const codemieProjectSettingsStatusSchema = z.object({
  error: z.string().optional(),
  id: z.string().optional(),
  value: codemieProjectSettingsStatusEnum.optional(),
});

export const codemieProjectSettingsSchema = kubeObjectBaseSchema
  .extend({
    spec: codemieProjectSettingsSpecSchema,
    status: codemieProjectSettingsStatusSchema.optional(),
  })
  .required();

export const codemieProjectSettingsDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: codemieProjectSettingsSpecSchema,
});
