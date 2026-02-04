import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";
import { configAuditReportSpecSchema } from "../ConfigAuditReport/schema.js";

export const clusterConfigAuditReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  report: configAuditReportSpecSchema,
});
