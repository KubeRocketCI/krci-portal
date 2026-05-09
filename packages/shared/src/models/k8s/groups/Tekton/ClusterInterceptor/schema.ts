import z from "zod";
import { kubeObjectBaseSchema } from "../../../common/index.js";
import { clientConfigSchema } from "../common/schema.js";

const clusterInterceptorSpecSchema = z
  .object({
    clientConfig: clientConfigSchema.optional(),
    description: z.string().optional(),
    params: z.array(z.object({ name: z.string(), value: z.unknown() }).catchall(z.any())).optional(),
  })
  .catchall(z.any());

export const clusterInterceptorSchema = kubeObjectBaseSchema
  .extend({
    spec: clusterInterceptorSpecSchema.optional(),
  })
  .catchall(z.any());
