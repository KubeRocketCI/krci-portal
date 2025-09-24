import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
} from "../../../common";
import { gitProviderEnum } from "../common";

const gitServerStatusEnum = z.enum(["ok", "failed"]);

const gitServerSpecSchema = z
  .object({
    gitHost: z.string(),
    gitProvider: gitProviderEnum.default("github"),
    gitUser: z.string().default("git"),
    httpsPort: z.number().int(),
    nameSshKeySecret: z.string(),
    skipWebhookSSLVerification: z.boolean().optional(),
    sshPort: z.number().int(),
    webhookUrl: z.string().optional(),
  })
  .required({
    gitHost: true,
    httpsPort: true,
    nameSshKeySecret: true,
    sshPort: true,
  });

const gitServerStatusSchema = z.object({
  connected: z.boolean().optional(),
  error: z.string().optional(),
  status: gitServerStatusEnum.optional(),
});

export const gitServerSchema = kubeObjectBaseSchema
  .extend({
    spec: gitServerSpecSchema,
    status: gitServerStatusSchema.optional(),
  })
  .required();

export const gitServerDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: gitServerSpecSchema,
});
