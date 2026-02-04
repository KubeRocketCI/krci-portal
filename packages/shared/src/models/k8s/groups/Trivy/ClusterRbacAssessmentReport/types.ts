import z from "zod";
import { clusterRbacAssessmentReportSchema } from "./schema.js";

export type ClusterRbacAssessmentReport = z.infer<typeof clusterRbacAssessmentReportSchema>;
