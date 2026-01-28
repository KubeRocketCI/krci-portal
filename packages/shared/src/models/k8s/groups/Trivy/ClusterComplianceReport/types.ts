import z from "zod";
import {
  clusterComplianceReportSchema,
  complianceSeverityEnum,
  complianceSpecSchema,
  controlCheckSchema,
  controlResultSchema,
  statusSummarySchema,
} from "./schema.js";

export type ClusterComplianceReport = z.infer<typeof clusterComplianceReportSchema>;

export type ComplianceSeverity = z.infer<typeof complianceSeverityEnum>;

export type ComplianceSpec = z.infer<typeof complianceSpecSchema>;

export type ControlCheck = z.infer<typeof controlCheckSchema>;

export type ControlResult = z.infer<typeof controlResultSchema>;

export type StatusSummary = z.infer<typeof statusSummarySchema>;
