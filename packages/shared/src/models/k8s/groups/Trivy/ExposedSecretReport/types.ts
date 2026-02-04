import z from "zod";
import { exposedSecretReportSchema, exposedSecretReportSpecSchema, exposedSecretSeverityEnum } from "./schema.js";

export type ExposedSecretReport = z.infer<typeof exposedSecretReportSchema>;

export type ExposedSecretReportSpec = z.infer<typeof exposedSecretReportSpecSchema>;

export type ExposedSecretSeverity = z.infer<typeof exposedSecretSeverityEnum>;

export interface ExposedSecret {
  target: string;
  ruleID: string;
  title?: string;
  category?: string;
  severity: ExposedSecretSeverity;
  match?: string;
}
