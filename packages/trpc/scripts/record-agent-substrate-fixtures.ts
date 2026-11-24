/**
 * Records the Agent Substrate fixtures from a live cluster through the gRPC adapter.
 *
 * Writes:
 *   src/clients/agentSubstrate/__fixtures__/testbed.json  MemoryFleet for the memory adapter.
 *   apps/client/src/modules/agent-substrate/__fixtures__/fleet.testbed.json  Fleet for Storybook.
 *
 * Actor template env: only the AGENT_ENV entries (ADR 0001) are kept, and none that holds an in-cluster address.
 * The script fails when the output holds a SESSION_ID, GITLAB_URL or BOT_USERNAME value or an in-cluster address.
 *
 * Run from packages/trpc, with the Agent Substrate API forwarded to a local port:
 *   kubectl -n ate-system port-forward svc/api 18443:443
 *   kubectl -n krci create token krci-portal --audience api.ate-system.svc --duration 10m > "$TMPDIR/ate-token"
 *   kubectl get clustertrustbundles -l podcert.ate.dev/canarying=live \
 *     --field-selector spec.signerName=servicedns.podcert.ate.dev/identity \
 *     -o jsonpath='{.items[0].spec.trustBundle}' > "$TMPDIR/ate-ca.crt"
 *   pnpm exec tsx scripts/record-agent-substrate-fixtures.ts \
 *     --url https://api.ate-system.svc:443 --forward 127.0.0.1:18443 \
 *     --token-file "$TMPDIR/ate-token" --ca-file "$TMPDIR/ate-ca.crt"
 */
import { mkdirSync, writeFileSync } from "node:fs";
import type { LookupFunction } from "node:net";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fleetSchema } from "@my-project/shared";
import { format, resolveConfig } from "prettier";
import { GrpcAgentSubstrateSource } from "../src/clients/agentSubstrate/grpc/index.js";
import { MemoryAgentSubstrateSource, type MemoryFleet } from "../src/clients/agentSubstrate/memory.js";
import type { SubstrateActorTemplate } from "../src/clients/agentSubstrate/source.js";
import type { TRPCContext } from "../src/context/types.js";
import { getFleet } from "../src/routers/agentSubstrate/fleet/index.js";
import { AGENT_ENV } from "../src/routers/agentSubstrate/fleet/substrateRead.js";
import { CHECKED_ENV, IN_CLUSTER_ADDRESS } from "../src/clients/agentSubstrate/__fixtures__/guards.js";

const KEPT_ENV = new Set<string>(Object.values(AGENT_ENV));
const CHECKED_ENV_NAMES = new Set(CHECKED_ENV);

const MEMORY_FIXTURE = resolve("src/clients/agentSubstrate/__fixtures__/testbed.json");
const STORYBOOK_FIXTURE = resolve("../../apps/client/src/modules/agent-substrate/__fixtures__/fleet.testbed.json");

const { values } = parseArgs({
  options: {
    url: { type: "string" },
    forward: { type: "string" },
    "token-file": { type: "string" },
    "ca-file": { type: "string" },
  },
});
if (!values.url || !values.forward || !values["token-file"] || !values["ca-file"]) {
  console.error("Usage: --url <https://host:port> --forward <ip:port> --token-file <path> --ca-file <path>");
  process.exit(2);
}

const [forwardHost, forwardPort] = values.forward.split(":");
const url = new URL(values.url);
url.port = forwardPort;
/** Sends the URL host to the port-forward; TLS still verifies the URL host. */
const lookup: LookupFunction = (_hostname, options, callback) => {
  if (options.all) callback(null, [{ address: forwardHost, family: 4 }]);
  else callback(null, forwardHost, 4);
};

/** Keeps only the AGENT_ENV entries. Records the values of the CHECKED_ENV entries. */
function scrubActorTemplate(
  actorTemplate: SubstrateActorTemplate,
  removed: Map<string, string>
): SubstrateActorTemplate {
  return {
    ...actorTemplate,
    containers: actorTemplate.containers.map((container) => ({
      ...container,
      env: container.env.filter(({ name, value }) => {
        if (CHECKED_ENV_NAMES.has(name) && value) removed.set(value, name);
        return KEPT_ENV.has(name) && !IN_CLUSTER_ADDRESS.test(value);
      }),
    })),
  };
}

/** JSON paths of the strings equal to `value`. Exact match only. */
function pathsEqualTo(data: unknown, value: string, path = "$"): string[] {
  if (typeof data === "string") return data === value ? [path] : [];
  if (Array.isArray(data)) return data.flatMap((item, index) => pathsEqualTo(item, value, `${path}[${index}]`));
  if (data && typeof data === "object") {
    return Object.entries(data).flatMap(([key, item]) => pathsEqualTo(item, value, `${path}.${key}`));
  }
  return [];
}

const source = new GrpcAgentSubstrateSource({
  url: url.toString(),
  tokenFile: values["token-file"],
  caFile: values["ca-file"],
  lookup,
});

try {
  const [atespaces, actors, workers] = await Promise.all([
    source.listAtespaces(),
    source.listActors(),
    source.listWorkers(),
  ]);
  /** CHECKED_ENV value to its env name. */
  const removed = new Map<string, string>();
  const actorTemplates = await Promise.all(actors.map((actor) => source.getActorTemplate(actor.actorTemplate)));
  const fleet: MemoryFleet = {
    atespaces,
    actors,
    actorTemplates: actorTemplates.map((actorTemplate) => scrubActorTemplate(actorTemplate, removed)),
    workers,
  };

  const storybookFleet = fleetSchema.parse(
    await getFleet({ agentSubstrateSource: new MemoryAgentSubstrateSource(fleet) } as unknown as TRPCContext)
  );

  for (const [file, data] of [
    [MEMORY_FIXTURE, fleet],
    [STORYBOOK_FIXTURE, storybookFleet],
  ] as const) {
    const json = `${JSON.stringify(data, null, 2)}\n`;
    const leaked = [...removed].flatMap(([value, name]) =>
      pathsEqualTo(data, value).map((path) => `${name} at ${path}`)
    );
    if (leaked.length) {
      throw new Error(`${file} still holds removed env values: ${leaked.join(", ")}`);
    }
    const address = json.match(new RegExp(`.{0,40}(${IN_CLUSTER_ADDRESS.source})`));
    if (address) {
      throw new Error(`${file} still holds an in-cluster address: ${address[0]}`);
    }
    mkdirSync(dirname(file), { recursive: true });
    // plugins: [] overrides the client prettier plugin; trpc does not resolve it.
    writeFileSync(file, await format(json, { ...(await resolveConfig(file)), plugins: [], filepath: file }));
    console.log(`Wrote ${file}`);
  }
  console.log(`${atespaces.length} atespaces, ${actors.length} actors, ${workers.length} workers`);
} finally {
  source.close();
}
