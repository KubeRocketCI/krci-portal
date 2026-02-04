import z from "zod";
import { clusterInfraAssessmentReportSchema } from "./schema.js";

export type ClusterInfraAssessmentReport = z.infer<typeof clusterInfraAssessmentReportSchema>;
