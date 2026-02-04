import z from "zod";
import { clusterConfigAuditReportSchema } from "./schema.js";

export type ClusterConfigAuditReport = z.infer<typeof clusterConfigAuditReportSchema>;
