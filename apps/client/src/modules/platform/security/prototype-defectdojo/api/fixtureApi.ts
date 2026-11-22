// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { z } from "zod";
import {
  PROTOTYPE_DEFECTDOJO_SEVERITIES,
  PROTOTYPE_RUNTIME_SECRET_FINDING_TITLE,
  prototypeDefectDojoCountsResultSchema,
  prototypeDefectDojoFindingsResultSchema,
  prototypeDefectDojoProductSetCountsResultSchema,
  prototypeDefectDojoProductsResultSchema,
  prototypeDefectDojoTestsResultSchema,
  type PrototypeDefectDojoFinding,
  type PrototypeDefectDojoListFindingsInput,
  type PrototypeDefectDojoProduct,
  type PrototypeDefectDojoScopeCounts,
  type PrototypeDefectDojoSeverityCounts,
  type PrototypeDefectDojoTest,
} from "@my-project/shared";
import type { PrototypeDefectDojoApi } from "./context";

/** Shape of `__fixtures__/defectdojo-testbed.json`, written by `packages/trpc/scripts/prototype-defectdojo-record.ts`. */
const fixtureSchema = z.object({
  /** The record with empty `tags` holds every product of the Product Type. */
  products: z.array(z.object({ tags: z.array(z.string()), result: prototypeDefectDojoProductsResultSchema })),
  tests: z.array(z.object({ tags: z.array(z.string()), result: prototypeDefectDojoTestsResultSchema })),
  /** Tests are recorded with `withInactive: true`, products without. */
  counts: z.array(
    z.object({ scope: z.enum(["test", "product"]), id: z.number(), result: prototypeDefectDojoCountsResultSchema })
  ),
  /** Findings of every state of one test, most severe first. */
  findings: z.array(z.object({ testId: z.number(), result: prototypeDefectDojoFindingsResultSchema })),
  /** Calls recorded as they are. An input equal to a recorded one gets the recorded result. */
  calls: z.array(
    z.object({
      procedure: z.enum(["listFindings", "productSetCounts"]),
      input: z.record(z.unknown()),
      result: z.unknown(),
    })
  ),
});

/**
 * `recorded`: answers from the fixture. A request the fixture does not hold is computed from the
 * recorded objects, so its list can be shorter than the live one.
 * The other modes answer every request with that state.
 */
export type PrototypeDefectDojoFixtureMode = "recorded" | "notConfigured" | "unreachable" | "noData";

const DEFAULT_FINDINGS_LIMIT = 25;

function hasEveryTag(tags: string[], wanted: string[]): boolean {
  return wanted.every((tag) => tags.includes(tag.toLowerCase()));
}

function sameTags(left: string[], right: string[]): boolean {
  return left.length === right.length && hasEveryTag(left, right);
}

function matchesFlag(filter: boolean | undefined, value: boolean): boolean {
  return filter === undefined || filter === value;
}

/** JSON of a call input with sorted keys and without undefined values. */
function inputKey(input: Record<string, unknown>): string {
  const entries = Object.entries(input)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(entries);
}

/** Mirrors the upstream path the server builds, for the request log of the stories. */
function findingsRequestPath(input: PrototypeDefectDojoListFindingsInput, limit: number, offset: number): string {
  const params = new URLSearchParams();
  const entries: [string, string | number | boolean | undefined][] = [
    ["test", input.testId],
    ["test__engagement__product", input.productId],
    ["test__engagement__product__tags__and", input.productTagsAll?.join(",")],
    ["test__engagement__product__tags", input.productTagsAny?.join(",")],
    ["test__tags__and", input.testTagsAll?.join(",")],
    ["test__test_type", input.scanType],
    ["title", input.runtimeSecretsOnly ? PROTOTYPE_RUNTIME_SECRET_FINDING_TITLE : undefined],
    ["vulnerability_id", input.vulnerabilityId],
    ["component_name", input.componentName],
    ["limit", limit],
    ["offset", offset],
    ["severity", input.severity],
    ["active", input.active],
    ["false_p", input.falsePositive],
    ["out_of_scope", input.outOfScope],
    ["is_mitigated", input.mitigated],
    ["duplicate", input.duplicate],
    ["risk_accepted", input.riskAccepted],
    ["related_fields", input.withTest ? true : undefined],
    ["prefetch", input.withTest ? "test" : undefined],
    ["o", "numerical_severity"],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }
  return `/api/v2/findings/?${params.toString()}`;
}

function addCounts(sum: PrototypeDefectDojoSeverityCounts, item: PrototypeDefectDojoSeverityCounts) {
  sum.critical += item.critical;
  sum.high += item.high;
  sum.medium += item.medium;
  sum.low += item.low;
  sum.info += item.info;
  sum.total += item.total;
}

/** In-memory `PrototypeDefectDojoApi` over a recorded fixture. Throws when the fixture does not match the schemas. */
export function createFixtureDefectDojoApi(
  rawFixture: unknown,
  mode: PrototypeDefectDojoFixtureMode = "recorded"
): PrototypeDefectDojoApi {
  if (mode === "notConfigured") {
    const notConfigured = async () => ({ state: "notConfigured" as const });
    return {
      listProducts: notConfigured,
      listTests: notConfigured,
      severityCounts: notConfigured,
      productSetCounts: notConfigured,
      listFindings: notConfigured,
    };
  }

  if (mode === "unreachable" || mode === "noData") {
    const answer = async () => ({ state: mode, requests: [] });
    return {
      listProducts: answer,
      listTests: answer,
      severityCounts: answer,
      productSetCounts: answer,
      listFindings: answer,
    };
  }

  const fixture = fixtureSchema.parse(rawFixture);

  const allProducts: PrototypeDefectDojoProduct[] = fixture.products.flatMap((record) =>
    record.tags.length === 0 && record.result.state === "data" ? record.result.data : []
  );

  const testsById = new Map<number, PrototypeDefectDojoTest>();
  for (const record of fixture.tests) {
    if (record.result.state === "data") {
      for (const test of record.result.data) {
        testsById.set(test.id, test);
      }
    }
  }

  const findingsByTest = new Map<number, PrototypeDefectDojoFinding[]>();
  for (const record of fixture.findings) {
    if (record.result.state === "data") {
      findingsByTest.set(record.testId, record.result.data.findings);
    }
  }

  const callResults = new Map<string, unknown>();
  for (const call of fixture.calls) {
    callResults.set(`${call.procedure}|${inputKey(call.input)}`, call.result);
  }

  function productCounts(id: number): PrototypeDefectDojoScopeCounts | null {
    const record = fixture.counts.find((candidate) => candidate.scope === "product" && candidate.id === id);
    return record?.result.state === "data" ? (record.result.data[0] ?? null) : null;
  }

  /** Tests in the scope of a findings request, for a request that was not recorded. */
  function scopeTests(input: PrototypeDefectDojoListFindingsInput): PrototypeDefectDojoTest[] {
    const tests = [...testsById.values()];
    if (input.testId !== undefined) {
      return tests.filter((test) => test.id === input.testId);
    }
    if (input.productId !== undefined) {
      return tests.filter((test) => test.product.id === input.productId);
    }

    let scoped = tests;
    const productTagsAll = input.productTagsAll;
    if (productTagsAll && productTagsAll.length > 0) {
      const ids = new Set(allProducts.filter((item) => hasEveryTag(item.tags, productTagsAll)).map((item) => item.id));
      scoped = scoped.filter((test) => ids.has(test.product.id));
    }
    const productTagsAny = input.productTagsAny;
    if (productTagsAny && productTagsAny.length > 0) {
      const wanted = productTagsAny.map((tag) => tag.toLowerCase());
      const ids = new Set(
        allProducts.filter((item) => item.tags.some((tag) => wanted.includes(tag))).map((item) => item.id)
      );
      scoped = scoped.filter((test) => ids.has(test.product.id));
    }
    const testTagsAll = input.testTagsAll;
    if (testTagsAll && testTagsAll.length > 0) {
      scoped = scoped.filter((test) => hasEveryTag(test.tags, testTagsAll));
    }
    return scoped;
  }

  return {
    async listProducts(input) {
      const tags = input.tags ?? [];
      const record = fixture.products.find((candidate) => sameTags(candidate.tags, tags));
      if (record) {
        return record.result;
      }

      const products = allProducts.filter((product) => hasEveryTag(product.tags, tags));
      return products.length > 0 ? { state: "data", requests: [], data: products } : { state: "noData", requests: [] };
    },

    async listTests(input) {
      const record = fixture.tests.find((candidate) => sameTags(candidate.tags, input.tags));
      if (record) {
        return record.result;
      }

      const tests = [...testsById.values()].filter((test) => hasEveryTag(test.tags, input.tags));
      return tests.length > 0 ? { state: "data", requests: [], data: tests } : { state: "noData", requests: [] };
    },

    async severityCounts(input) {
      const requests: string[] = [];
      const data: PrototypeDefectDojoScopeCounts[] = [];
      const wanted = [
        ...(input.testIds ?? []).map((id) => ({ scope: "test" as const, id })),
        ...(input.productIds ?? []).map((id) => ({ scope: "product" as const, id })),
      ];

      for (const { scope, id } of wanted) {
        const record = fixture.counts.find((candidate) => candidate.scope === scope && candidate.id === id);
        if (!record || record.result.state !== "data") {
          continue;
        }
        // The first recorded request is the `active=true` one; a second exists for `withInactive`.
        requests.push(...(input.withInactive ? record.result.requests : record.result.requests.slice(0, 1)));
        for (const counts of record.result.data) {
          data.push(input.withInactive ? counts : { ...counts, inactiveTotal: null });
        }
      }

      return data.length > 0 ? { state: "data", requests, data } : { state: "noData", requests };
    },

    async productSetCounts(input) {
      const recorded = callResults.get(`productSetCounts|${inputKey(input)}`);
      if (recorded !== undefined) {
        return prototypeDefectDojoProductSetCountsResultSchema.parse(recorded);
      }

      const active: PrototypeDefectDojoSeverityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
      for (const id of input.productIds) {
        const counts = productCounts(id);
        if (counts) {
          addCounts(active, counts.active);
        }
      }
      return {
        state: "data",
        requests: [`/api/v3/findings?limit=1&include=counts&active=true&asset__in=${input.productIds.join("%2C")}`],
        data: { active, inactiveTotal: null },
      };
    },

    async listFindings(input) {
      const recorded = callResults.get(`listFindings|${inputKey(input)}`);
      if (recorded !== undefined) {
        return prototypeDefectDojoFindingsResultSchema.parse(recorded);
      }

      const limit = input.limit ?? DEFAULT_FINDINGS_LIMIT;
      const offset = input.offset ?? 0;
      const requests = [findingsRequestPath(input, limit, offset)];

      const tests = scopeTests(input).filter((test) => !input.scanType || test.scanType === input.scanType);
      if (input.testId !== undefined && !findingsByTest.has(input.testId)) {
        return { state: "noData", requests };
      }

      const matching = tests
        .flatMap((test) =>
          (findingsByTest.get(test.id) ?? []).map((finding) => (input.withTest ? { ...finding, test } : finding))
        )
        .filter(
          (finding) =>
            (input.severity === undefined || finding.severity === input.severity) &&
            (!input.vulnerabilityId || finding.vulnerabilityIds.includes(input.vulnerabilityId)) &&
            (!input.componentName || finding.componentName === input.componentName) &&
            (!input.runtimeSecretsOnly || finding.title.includes(PROTOTYPE_RUNTIME_SECRET_FINDING_TITLE)) &&
            matchesFlag(input.active, finding.active) &&
            matchesFlag(input.falsePositive, finding.falsePositive) &&
            matchesFlag(input.outOfScope, finding.outOfScope) &&
            matchesFlag(input.mitigated, finding.mitigated) &&
            matchesFlag(input.duplicate, finding.duplicate) &&
            matchesFlag(input.riskAccepted, finding.riskAccepted)
        )
        .sort(
          (left, right) =>
            PROTOTYPE_DEFECTDOJO_SEVERITIES.indexOf(left.severity) -
              PROTOTYPE_DEFECTDOJO_SEVERITIES.indexOf(right.severity) || left.id - right.id
        );

      return {
        state: "data",
        requests,
        data: { count: matching.length, findings: matching.slice(offset, offset + limit) },
      };
    },
  };
}
