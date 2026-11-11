import { z } from "zod";

/**
 * The parts of the DefectDojo API v2 responses the portal reads.
 * Unknown fields are dropped.
 */

export const defectDojoProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const defectDojoEngagementSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  product: z.number().int(),
});

export const defectDojoTestSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  engagement: z.number().int(),
  tags: z.array(z.string()),
  test_type_name: z.string().nullish(),
  scan_type: z.string().nullish(),
  version: z.string().nullish(),
  updated: z.string().nullish(),
});

/** An engagement as DefectDojo expands it under `prefetch` (the product is expanded as well). */
export const defectDojoPrefetchedEngagementSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  product: z.object({ id: z.number().int(), name: z.string() }),
});

export const defectDojoFindingSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  severity: z.string(),
  test: z.number().int(),
  vulnerability_ids: z.array(z.object({ vulnerability_id: z.string() })).nullish(),
  component_name: z.string().nullish(),
  component_version: z.string().nullish(),
  file_path: z.string().nullish(),
  fix_available: z.boolean().nullish(),
  fix_version: z.string().nullish(),
  mitigation: z.string().nullish(),
});

function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    count: z.number().int().nonnegative(),
    results: z.array(item),
  });
}

export const defectDojoProductsPageSchema = pageSchema(defectDojoProductSchema);
export const defectDojoEngagementsPageSchema = pageSchema(defectDojoEngagementSchema);
export const defectDojoTestsPageSchema = pageSchema(defectDojoTestSchema).extend({
  prefetch: z.object({ engagement: z.record(defectDojoPrefetchedEngagementSchema).optional() }).optional(),
});
export const defectDojoFindingsPageSchema = pageSchema(defectDojoFindingSchema).extend({
  prefetch: z.object({ test: z.record(defectDojoTestSchema).optional() }).optional(),
});

/** Findings reduced to their severity. */
export const defectDojoFindingSeveritiesPageSchema = pageSchema(z.object({ severity: z.string() }));

/** Count-only responses: `limit=1` keeps `results` to a single row. */
export const defectDojoCountPageSchema = z.object({ count: z.number().int().nonnegative() });

export type DefectDojoProduct = z.infer<typeof defectDojoProductSchema>;
export type DefectDojoEngagement = z.infer<typeof defectDojoEngagementSchema>;
export type DefectDojoTest = z.infer<typeof defectDojoTestSchema>;
export type DefectDojoPrefetchedEngagement = z.infer<typeof defectDojoPrefetchedEngagementSchema>;
export type DefectDojoFinding = z.infer<typeof defectDojoFindingSchema>;
