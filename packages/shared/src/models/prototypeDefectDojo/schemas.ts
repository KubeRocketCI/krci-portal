// PROTOTYPE (EPMDEDP-16072): throwaway DefectDojo read path. Not for main.
import { z } from "zod";
import {
  PROTOTYPE_DEFECTDOJO_FINDINGS_MAX_LIMIT,
  PROTOTYPE_DEFECTDOJO_FINDINGS_WITH_TEST_MAX_LIMIT,
  PROTOTYPE_DEFECTDOJO_LEVELS,
  PROTOTYPE_DEFECTDOJO_REPORT_KINDS,
  PROTOTYPE_DEFECTDOJO_SEVERITIES,
} from "./constants.js";

export const prototypeDefectDojoLevelSchema = z.enum(PROTOTYPE_DEFECTDOJO_LEVELS);
export const prototypeDefectDojoSeveritySchema = z.enum(PROTOTYPE_DEFECTDOJO_SEVERITIES);

const linkedObjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  /** Deep link into the DefectDojo UI. */
  url: z.string(),
});

export const prototypeDefectDojoProductSchema = linkedObjectSchema.extend({
  tags: z.array(z.string()),
});

export const prototypeDefectDojoTestSchema = z.object({
  id: z.number(),
  title: z.string(),
  scanType: z.string(),
  /** `null`: the scan type is not in the level list. */
  level: prototypeDefectDojoLevelSchema.nullable(),
  /** Runtime tests only. `null` for the other levels and for an unknown kind. */
  reportKind: z.enum(PROTOTYPE_DEFECTDOJO_REPORT_KINDS).nullable(),
  branchTag: z.string(),
  /** Image tag for Image and Runtime tests. */
  version: z.string(),
  /** Upload marker of the operator. Empty on a Runtime test: the test is closed, its workload is not running. */
  buildId: z.string(),
  tags: z.array(z.string()),
  created: z.string(),
  updated: z.string(),
  url: z.string(),
  engagement: linkedObjectSchema,
  product: linkedObjectSchema,
});

export const prototypeDefectDojoSeverityCountsSchema = z.object({
  critical: z.number(),
  high: z.number(),
  medium: z.number(),
  low: z.number(),
  info: z.number(),
  total: z.number(),
});

export const prototypeDefectDojoScopeCountsSchema = z.object({
  scope: z.enum(["test", "product"]),
  id: z.number(),
  /** Active findings only. */
  active: prototypeDefectDojoSeverityCountsSchema,
  /** Findings that are not active (false positive, out of scope, mitigated, duplicate, risk accepted). `null`: not requested. */
  inactiveTotal: z.number().nullable(),
});

/** Counts of all findings of a set of products together. */
export const prototypeDefectDojoProductSetCountsSchema = z.object({
  active: prototypeDefectDojoSeverityCountsSchema,
  inactiveTotal: z.number().nullable(),
});

/** Allow-list of finding fields. `description` and `mitigation` are never part of it. */
export const prototypeDefectDojoFindingSchema = z.object({
  id: z.number(),
  testId: z.number(),
  /** Set when the list was read with `withTest`. */
  test: prototypeDefectDojoTestSchema.nullable(),
  title: z.string(),
  severity: prototypeDefectDojoSeveritySchema,
  active: z.boolean(),
  verified: z.boolean(),
  falsePositive: z.boolean(),
  outOfScope: z.boolean(),
  riskAccepted: z.boolean(),
  duplicate: z.boolean(),
  mitigated: z.boolean(),
  underReview: z.boolean(),
  date: z.string().nullable(),
  created: z.string().nullable(),
  updated: z.string().nullable(),
  mitigatedAt: z.string().nullable(),
  componentName: z.string().nullable(),
  componentVersion: z.string().nullable(),
  vulnerabilityIds: z.array(z.string()),
  cwe: z.number().nullable(),
  cvssv3Score: z.number().nullable(),
  epssScore: z.number().nullable(),
  knownExploited: z.boolean(),
  filePath: z.string().nullable(),
  line: z.number().nullable(),
  service: z.string().nullable(),
  fixAvailable: z.boolean().nullable(),
  fixVersion: z.string().nullable(),
  slaDaysRemaining: z.number().nullable(),
  tags: z.array(z.string()),
  url: z.string(),
});

export const prototypeDefectDojoFindingsPageSchema = z.object({
  /** Total number of findings that match the filters. */
  count: z.number(),
  findings: z.array(prototypeDefectDojoFindingSchema),
});

/**
 * The four states of a DefectDojo read. `requests` lists the upstream GET paths the read made.
 * `notConfigured`: the portal server has no DefectDojo URL or token.
 * `unreachable`: DefectDojo is down, timed out or rejected the token.
 * `noData`: DefectDojo answered and holds no object for the request.
 */
export function prototypeDefectDojoResultSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion("state", [
    z.object({ state: z.literal("notConfigured") }),
    z.object({ state: z.literal("unreachable"), requests: z.array(z.string()) }),
    z.object({ state: z.literal("noData"), requests: z.array(z.string()) }),
    z.object({ state: z.literal("data"), requests: z.array(z.string()), data: dataSchema }),
  ]);
}

export const prototypeDefectDojoProductsResultSchema = prototypeDefectDojoResultSchema(
  z.array(prototypeDefectDojoProductSchema)
);
export const prototypeDefectDojoTestsResultSchema = prototypeDefectDojoResultSchema(
  z.array(prototypeDefectDojoTestSchema)
);
export const prototypeDefectDojoCountsResultSchema = prototypeDefectDojoResultSchema(
  z.array(prototypeDefectDojoScopeCountsSchema)
);
export const prototypeDefectDojoProductSetCountsResultSchema = prototypeDefectDojoResultSchema(
  prototypeDefectDojoProductSetCountsSchema
);
export const prototypeDefectDojoFindingsResultSchema = prototypeDefectDojoResultSchema(
  prototypeDefectDojoFindingsPageSchema
);

const tagsSchema = z.array(z.string().min(1).max(255)).max(20);
const idSchema = z.number().int().positive();

/** Empty `tags`: every product of the configured Product Type. */
export const prototypeDefectDojoListProductsInputSchema = z.object({
  tags: tagsSchema.default([]),
});

/** A test matches when it carries every tag of `tags`. */
export const prototypeDefectDojoListTestsInputSchema = z.object({
  tags: tagsSchema.min(1),
});

export const prototypeDefectDojoSeverityCountsInputSchema = z.object({
  testIds: z.array(idSchema).max(200).default([]),
  productIds: z.array(idSchema).max(200).default([]),
  /** Adds one upstream request per id. */
  withInactive: z.boolean().default(false),
});

export const prototypeDefectDojoProductSetCountsInputSchema = z.object({
  productIds: z.array(idSchema).min(1).max(500),
  /** Adds one upstream request. */
  withInactive: z.boolean().default(false),
});

export const prototypeDefectDojoListFindingsInputSchema = z
  .object({
    /** Scope, at least one: a test, a product, product tags or test tags. */
    testId: idSchema.optional(),
    productId: idSchema.optional(),
    /** Findings of products that carry every tag. */
    productTagsAll: tagsSchema.optional(),
    /** Findings of products that carry any of the tags. */
    productTagsAny: tagsSchema.optional(),
    /** Findings of tests that carry every tag. */
    testTagsAll: tagsSchema.optional(),

    limit: z.number().int().min(1).max(PROTOTYPE_DEFECTDOJO_FINDINGS_MAX_LIMIT).default(25),
    offset: z.number().int().min(0).default(0),
    severity: prototypeDefectDojoSeveritySchema.optional(),
    /** Exact scan type of the test, for example `Gitleaks Scan`. Costs one more upstream request. */
    scanType: z.string().min(1).max(200).optional(),
    /** Exact vulnerability id, for example a CVE. */
    vulnerabilityId: z.string().min(1).max(100).optional(),
    /** Exact component name. */
    componentName: z.string().min(1).max(200).optional(),
    /** Findings of ExposedSecretReport tests only. */
    runtimeSecretsOnly: z.boolean().optional(),
    /** Resolves the test, engagement and product of every row. Limits `limit`. */
    withTest: z.boolean().default(false),

    /** Unset state filters do not restrict the list. */
    active: z.boolean().optional(),
    falsePositive: z.boolean().optional(),
    outOfScope: z.boolean().optional(),
    mitigated: z.boolean().optional(),
    duplicate: z.boolean().optional(),
    riskAccepted: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.testId !== undefined ||
      input.productId !== undefined ||
      (input.productTagsAll?.length ?? 0) > 0 ||
      (input.productTagsAny?.length ?? 0) > 0 ||
      (input.testTagsAll?.length ?? 0) > 0,
    { message: "a scope is required: testId, productId, productTagsAll, productTagsAny or testTagsAll" }
  )
  .refine((input) => !input.withTest || input.limit <= PROTOTYPE_DEFECTDOJO_FINDINGS_WITH_TEST_MAX_LIMIT, {
    message: `limit is at most ${PROTOTYPE_DEFECTDOJO_FINDINGS_WITH_TEST_MAX_LIMIT} with withTest`,
  });
