// PROTOTYPE (EPMDEDP-16072): records Storybook fixtures through the prototype DefectDojo router.
//
// Usage:
//   DD_HELPER=<abs path to dd-api.sh> DD_SECRET=<secret name> \
//     pnpm --filter=trpc exec node --import tsx scripts/prototype-defectdojo-record.ts <record-plan.json> <out.json>
//
// The router talks to a local relay. The relay passes each GET path to the helper script; the
// helper holds the DefectDojo token. No token reaches this process or the output file.
// Prints one line per procedure call: upstream request count and the sum of their seconds.
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { PROTOTYPE_DEFECTDOJO_FINDINGS_MAX_LIMIT } from "@my-project/shared";
import type { TRPCContext } from "../src/context/types.js";
import { createCaller } from "../src/routers/index.js";

interface RecordPlan {
  /** `listProducts` per tag set. Counts are recorded for every product found. */
  productTagSets: string[][];
  /** `listTests` per tag set. Counts and findings are recorded for every test found that is not closed. */
  testTagSets: string[][];
  /** `listTests` per tag set. Counts are recorded, findings are not. */
  testTagSetsCountsOnly: string[][];
  /** `listTests` per tag set, nothing else. */
  testTagSetsListOnly: string[][];
  /** Calls recorded as they are, for the list pages. */
  calls: { procedure: "listFindings" | "productSetCounts"; input: Record<string, unknown> }[];
}

const [planPath, outPath] = process.argv.slice(2);
const helper = process.env.DD_HELPER;

if (!planPath || !outPath || !helper) {
  console.error("Usage: DD_HELPER=<dd-api.sh> node --import tsx prototype-defectdojo-record.ts <plan.json> <out.json>");
  process.exit(2);
}

let upstreamSeconds = 0;

const relay = http.createServer((request, response) => {
  if (request.method !== "GET" || !request.url) {
    response.writeHead(405).end();
    return;
  }

  execFile("bash", [helper, "GET", request.url], { maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
    const status = Number(/status=(\d{3})/.exec(stderr)?.[1] ?? 502);
    upstreamSeconds += Number(/seconds=([\d.]+)/.exec(stderr)?.[1] ?? 0);
    response.writeHead(error ? 502 : status, { "Content-Type": "application/json" }).end(stdout);
  });
});

await new Promise<void>((resolve) => relay.listen(0, "127.0.0.1", resolve));

process.env.DEFECTDOJO_URL = `http://127.0.0.1:${(relay.address() as AddressInfo).port}`;
process.env.DEFECTDOJO_TOKEN = "relay";
process.env.DEFECTDOJO_WEB_URL = "https://defectdojo.example.com";

const farFuture = Date.now() + 24 * 60 * 60 * 1000;
// Only `session.user` is read by `protectedProcedure` and the prototype procedures.
const caller = createCaller({
  session: {
    user: { data: {}, authSource: "oidc", secret: { idTokenExpiresAt: farFuture, accessTokenExpiresAt: farFuture } },
  },
} as unknown as TRPCContext).prototypeDefectDojo;

/** Runs one procedure call and prints its upstream cost. */
async function measured<T extends { state: string; requests?: string[] }>(label: string, call: Promise<T>): Promise<T> {
  upstreamSeconds = 0;
  const result = await call;
  console.log(
    `${label}: ${result.state}, ${result.requests?.length ?? 0} requests, ${upstreamSeconds.toFixed(2)} s upstream`
  );
  return result;
}

const plan = JSON.parse(readFileSync(planPath, "utf8")) as RecordPlan;

const products = [];
const productIds = new Set<number>();
for (const tags of plan.productTagSets) {
  const result = await measured(`listProducts ${tags.join(",")}`, caller.listProducts({ tags }));
  products.push({ tags, result });
  if (result.state === "data") {
    for (const product of result.data) {
      productIds.add(product.id);
    }
  }
}

const tests = [];
const countedTestIds = new Set<number>();
const findingsTestIds = new Set<number>();
const tagSetGroups: [string[][], "findings" | "counts" | "list"][] = [
  [plan.testTagSets, "findings"],
  [plan.testTagSetsCountsOnly, "counts"],
  [plan.testTagSetsListOnly, "list"],
];
for (const [tagSets, depth] of tagSetGroups) {
  for (const tags of tagSets) {
    const result = await measured(`listTests ${tags.join(",")}`, caller.listTests({ tags }));
    tests.push({ tags, result });
    if (result.state !== "data" || depth === "list") {
      continue;
    }
    for (const test of result.data) {
      const closed = test.level === "runtime" && test.buildId === "";
      if (closed) {
        continue;
      }
      countedTestIds.add(test.id);
      if (depth === "findings") {
        findingsTestIds.add(test.id);
      }
    }
  }
}

const counts = [];
for (const id of productIds) {
  counts.push({
    scope: "product",
    id,
    result: await measured(`severityCounts product ${id}`, caller.severityCounts({ productIds: [id] })),
  });
}
for (const id of countedTestIds) {
  counts.push({
    scope: "test",
    id,
    result: await measured(`severityCounts test ${id}`, caller.severityCounts({ testIds: [id], withInactive: true })),
  });
}

const findings = [];
for (const testId of findingsTestIds) {
  findings.push({
    testId,
    result: await measured(
      `listFindings test ${testId}`,
      caller.listFindings({ testId, limit: PROTOTYPE_DEFECTDOJO_FINDINGS_MAX_LIMIT })
    ),
  });
}

const calls = [];
for (const call of plan.calls) {
  const label = `${call.procedure} ${JSON.stringify(call.input)}`;
  const result =
    call.procedure === "listFindings"
      ? await measured(label, caller.listFindings(call.input as Parameters<typeof caller.listFindings>[0]))
      : await measured(label, caller.productSetCounts(call.input as Parameters<typeof caller.productSetCounts>[0]));
  calls.push({ procedure: call.procedure, input: call.input, result });
}

writeFileSync(outPath, `${JSON.stringify({ products, tests, counts, findings, calls }, null, 2)}\n`);
console.log(
  `Recorded ${products.length} product lists, ${tests.length} test lists, ${counts.length} counts, ${findings.length} finding lists, ${calls.length} calls to ${outPath}`
);

relay.close();
