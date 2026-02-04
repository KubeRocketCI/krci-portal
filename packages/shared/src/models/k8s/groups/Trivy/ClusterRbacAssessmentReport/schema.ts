import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";
import { rbacAssessmentReportSpecSchema } from "../RbacAssessmentReport/schema.js";

export const clusterRbacAssessmentReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  report: rbacAssessmentReportSpecSchema,
});
