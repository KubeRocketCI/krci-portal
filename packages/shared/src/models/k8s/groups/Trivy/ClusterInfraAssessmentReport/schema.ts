import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";
import { infraAssessmentReportSpecSchema } from "../InfraAssessmentReport/schema.js";

export const clusterInfraAssessmentReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  report: infraAssessmentReportSpecSchema,
});
