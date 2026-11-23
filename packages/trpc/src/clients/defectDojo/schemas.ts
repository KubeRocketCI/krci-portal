import { z } from "zod";
import { DEFECTDOJO_SEVERITIES } from "./constants.js";

/**
 * The parts of the DefectDojo API answers the client reads. Every other field is dropped on parse, so a field
 * reaches the portal only when a schema here names it.
 */

const id = z.number().int();
const count = z.number().int().nonnegative();

export const productTypeRefSchema = z.object({ id, name: z.string() });

export const productRowSchema = z.object({ id, name: z.string(), tags: z.array(z.string()), prod_type: id });

export const testRowSchema = z.object({
  id,
  title: z.string().nullish(),
  scan_type: z.string(),
  branch_tag: z.string().nullish(),
  commit_hash: z.string().nullish(),
  version: z.string().nullish(),
  build_id: z.string().nullish(),
  tags: z.array(z.string()),
  created: z.string(),
  updated: z.string(),
  engagement: id,
});

export const testEngagementSchema = z.object({
  id,
  name: z.string(),
  product: z.object({ id, name: z.string(), prod_type: productTypeRefSchema }),
});

export type TestRow = z.infer<typeof testRowSchema>;
export type TestEngagement = z.infer<typeof testEngagementSchema>;

/** A page of a list, with the related objects of one `prefetch` field by id. */
export function listPageSchema<Row extends z.ZodTypeAny, Related extends z.ZodTypeAny>(
  row: Row,
  prefetchField: string,
  related: Related
) {
  return z.object({
    count,
    results: z.array(row),
    prefetch: z.object({ [prefetchField]: z.record(related).optional() }).optional(),
  });
}

/** API v3 findings list with `include=counts`: the rows are not read. */
export const countsAnswerSchema = z.object({
  meta: z.object({
    counts: z.object({
      total: count,
      active: count,
      severity: z.object({ Critical: count, High: count, Medium: count, Low: count, Info: count }),
    }),
  }),
});

export const testSchema = z.object({ id });

export const testTypesPageSchema = z.object({
  results: z.array(z.object({ id, name: z.string() })),
});

/**
 * A finding row with the fields of the allow-list only. `description` and `mitigation` are not in it: the text of
 * a secret finding holds the secret, and no finding of the portal needs either.
 */
export const findingRowSchema = z.object({
  id,
  title: z.string(),
  severity: z.enum(DEFECTDOJO_SEVERITIES),
  active: z.boolean(),
  verified: z.boolean(),
  duplicate: z.boolean(),
  false_p: z.boolean(),
  out_of_scope: z.boolean(),
  risk_accepted: z.boolean(),
  is_mitigated: z.boolean(),
  under_review: z.boolean(),
  date: z.string().nullish(),
  created: z.string().nullish(),
  updated: z.string().nullish(),
  mitigated: z.string().nullish(),
  component_name: z.string().nullish(),
  component_version: z.string().nullish(),
  vulnerability_ids: z.array(z.object({ vulnerability_id: z.string() })).nullish(),
  file_path: z.string().nullish(),
  line: z.number().int().nullish(),
  service: z.string().nullish(),
  fix_available: z.boolean().nullish(),
  fix_version: z.string().nullish(),
  test: id,
  related_fields: z.object({
    test: z.object({ id, engagement: z.object({ id, product: z.object({ id }) }) }),
  }),
});

export const findingsPageSchema = z.object({ count, results: z.array(findingRowSchema) });

export type FindingRow = z.infer<typeof findingRowSchema>;
