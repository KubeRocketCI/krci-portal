// PROTOTYPE (EPMDEDP-16072): throwaway DefectDojo read path. Not for main.
import { z } from "zod";
import {
  prototypeDefectDojoCountsResultSchema,
  prototypeDefectDojoFindingSchema,
  prototypeDefectDojoFindingsPageSchema,
  prototypeDefectDojoFindingsResultSchema,
  prototypeDefectDojoLevelSchema,
  prototypeDefectDojoListFindingsInputSchema,
  prototypeDefectDojoListProductsInputSchema,
  prototypeDefectDojoListTestsInputSchema,
  prototypeDefectDojoProductSchema,
  prototypeDefectDojoProductSetCountsInputSchema,
  prototypeDefectDojoProductSetCountsResultSchema,
  prototypeDefectDojoProductSetCountsSchema,
  prototypeDefectDojoProductsResultSchema,
  prototypeDefectDojoScopeCountsSchema,
  prototypeDefectDojoSeverityCountsInputSchema,
  prototypeDefectDojoSeverityCountsSchema,
  prototypeDefectDojoSeveritySchema,
  prototypeDefectDojoTestSchema,
  prototypeDefectDojoTestsResultSchema,
} from "./schemas.js";

export type PrototypeDefectDojoLevel = z.infer<typeof prototypeDefectDojoLevelSchema>;
export type PrototypeDefectDojoSeverity = z.infer<typeof prototypeDefectDojoSeveritySchema>;
export type PrototypeDefectDojoProduct = z.infer<typeof prototypeDefectDojoProductSchema>;
export type PrototypeDefectDojoTest = z.infer<typeof prototypeDefectDojoTestSchema>;
export type PrototypeDefectDojoSeverityCounts = z.infer<typeof prototypeDefectDojoSeverityCountsSchema>;
export type PrototypeDefectDojoScopeCounts = z.infer<typeof prototypeDefectDojoScopeCountsSchema>;
export type PrototypeDefectDojoProductSetCounts = z.infer<typeof prototypeDefectDojoProductSetCountsSchema>;
export type PrototypeDefectDojoFinding = z.infer<typeof prototypeDefectDojoFindingSchema>;
export type PrototypeDefectDojoFindingsPage = z.infer<typeof prototypeDefectDojoFindingsPageSchema>;

export type PrototypeDefectDojoProductsResult = z.infer<typeof prototypeDefectDojoProductsResultSchema>;
export type PrototypeDefectDojoTestsResult = z.infer<typeof prototypeDefectDojoTestsResultSchema>;
export type PrototypeDefectDojoCountsResult = z.infer<typeof prototypeDefectDojoCountsResultSchema>;
export type PrototypeDefectDojoProductSetCountsResult = z.infer<typeof prototypeDefectDojoProductSetCountsResultSchema>;
export type PrototypeDefectDojoFindingsResult = z.infer<typeof prototypeDefectDojoFindingsResultSchema>;

export type PrototypeDefectDojoListProductsInput = z.input<typeof prototypeDefectDojoListProductsInputSchema>;
export type PrototypeDefectDojoListTestsInput = z.input<typeof prototypeDefectDojoListTestsInputSchema>;
export type PrototypeDefectDojoSeverityCountsInput = z.input<typeof prototypeDefectDojoSeverityCountsInputSchema>;
export type PrototypeDefectDojoProductSetCountsInput = z.input<typeof prototypeDefectDojoProductSetCountsInputSchema>;
export type PrototypeDefectDojoListFindingsInput = z.input<typeof prototypeDefectDojoListFindingsInputSchema>;
