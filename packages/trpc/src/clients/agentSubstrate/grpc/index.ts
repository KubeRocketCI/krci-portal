import type { LookupFunction } from "node:net";
import { createClient, type CallOptions, type Client } from "@connectrpc/connect";
import { createGrpcTransport, Http2SessionManager } from "@connectrpc/connect-node";
import {
  AgentSubstrateSourceError,
  type AgentSubstrateSource,
  type SubstrateActor,
  type SubstrateActorTemplate,
  type SubstrateAtespace,
  type SubstrateObjectRef,
  type SubstrateWorker,
} from "../source.js";
import { CaFile, TokenFile } from "./credentials.js";
import { toSourceError } from "./errors.js";
import { Control } from "./gen/ateapi/v1/ateapi_pb.js";
import { toActor, toActorTemplate, toAtespace, toWorker } from "./mapping.js";

/** Agent Substrate accepts pings no more often than every 30 s. */
const PING_INTERVAL_MS = 30_000;
const CALL_TIMEOUT_MS = 15_000;
/** Server maximum. */
const PAGE_SIZE = 1000;
/** Maximum pages per list. */
const MAX_PAGES = 1000;

export interface GrpcAgentSubstrateSourceOptions {
  /** `https://<host>[:<port>]`. The host is the TLS server name. */
  url: string;
  /** Projected ServiceAccount token. */
  tokenFile: string;
  /** PEM bundle that signs the server certificate. */
  caFile: string;
  /** Default: DNS. Maps the URL host to another address, e.g. a port-forward. */
  lookup?: LookupFunction;
  /** Default: Date.now. */
  now?: () => number;
}

interface Connection {
  client: Client<typeof Control>;
  sessionManager: Http2SessionManager;
  activeCalls: number;
  /** Replaced after a CA change. */
  retired: boolean;
}

interface Page<T> {
  items: T[];
  nextPageToken: string;
}

/** Read-only gRPC adapter of `substrate.ateapi.v1.Control`. A connection opens on the first call. */
export class GrpcAgentSubstrateSource implements AgentSubstrateSource {
  /** The parsed AGENT_SUBSTRATE_URL, or the error every call rejects with. */
  private readonly target: URL | AgentSubstrateSourceError;
  private readonly token: TokenFile;
  private readonly ca: CaFile;
  private readonly lookup: LookupFunction | undefined;
  private connection: Connection | null = null;

  constructor(options: GrpcAgentSubstrateSourceOptions) {
    this.target = parseUrl(options.url);
    this.token = new TokenFile(options.tokenFile, options.now ?? Date.now);
    this.ca = new CaFile(options.caFile);
    this.lookup = options.lookup;
  }

  listAtespaces(): Promise<SubstrateAtespace[]> {
    return this.listAll(
      async (client, pageToken, opts) => {
        const res = await client.listAtespaces({ options: { pageSize: PAGE_SIZE, pageToken } }, opts);
        return { items: res.atespaces.map(toAtespace), nextPageToken: res.nextPageToken };
      },
      (atespace) => atespace.uid || atespace.name
    );
  }

  listActors(): Promise<SubstrateActor[]> {
    return this.listAll(
      async (client, pageToken, opts) => {
        const res = await client.listActors({ atespace: "", options: { pageSize: PAGE_SIZE, pageToken } }, opts);
        return { items: res.actors.map(toActor), nextPageToken: res.nextPageToken };
      },
      (actor) => actor.uid || `${actor.atespace}/${actor.name}`
    );
  }

  getActorTemplate(ref: SubstrateObjectRef): Promise<SubstrateActorTemplate> {
    return this.call(async (client, opts) =>
      toActorTemplate(await client.getActorTemplate({ actorTemplate: ref }, opts))
    );
  }

  listWorkers(): Promise<SubstrateWorker[]> {
    return this.listAll(
      async (client, pageToken, opts) => {
        const res = await client.listWorkers({ options: { pageSize: PAGE_SIZE, pageToken } }, opts);
        return { items: res.workers.map(toWorker), nextPageToken: res.nextPageToken };
      },
      (worker) => worker.name
    );
  }

  /** Closes the connection. A later call opens a new one. */
  close(): void {
    this.connection?.sessionManager.abort();
    this.connection = null;
  }

  /** Reads every page. List pagination is soft: an item seen on two pages is kept once, by `key`. */
  private async listAll<T>(
    readPage: (client: Client<typeof Control>, pageToken: string, opts: CallOptions) => Promise<Page<T>>,
    key: (item: T) => string
  ): Promise<T[]> {
    return this.call(async (client, opts) => {
      const items = new Map<string, T>();
      let pageToken = "";
      for (let page = 0; page < MAX_PAGES; page++) {
        const result = await readPage(client, pageToken, opts);
        for (const item of result.items) items.set(key(item), item);
        if (!result.nextPageToken) return [...items.values()];
        pageToken = result.nextPageToken;
      }
      throw new AgentSubstrateSourceError("other", `list returned more than ${MAX_PAGES} pages`);
    });
  }

  private async call<T>(run: (client: Client<typeof Control>, opts: CallOptions) => Promise<T>): Promise<T> {
    if (this.target instanceof AgentSubstrateSourceError) throw this.target;

    let opts: CallOptions;
    try {
      opts = {
        headers: new Headers({ authorization: `Bearer ${await this.token.read()}` }),
        timeoutMs: CALL_TIMEOUT_MS,
      };
    } catch (error) {
      throw new AgentSubstrateSourceError("unauthenticated", `cannot read the token: ${errorMessage(error)}`, {
        cause: error,
      });
    }

    const connection = await this.acquireConnection(this.target);
    try {
      return await run(connection.client, opts);
    } catch (error) {
      throw toSourceError(error);
    } finally {
      connection.activeCalls--;
      closeIfDone(connection);
    }
  }

  /**
   * Returns the connection with the call counted in `activeCalls`; the caller releases it.
   * A changed CA file opens a new connection; the previous one closes when its last call ends.
   * An unreadable CA file keeps an open connection in use.
   */
  private async acquireConnection(baseUrl: URL): Promise<Connection> {
    let ca: { pem: string; changed: boolean };
    try {
      ca = await this.ca.read();
    } catch (error) {
      if (this.connection) return acquire(this.connection);
      throw new AgentSubstrateSourceError("unavailable", `cannot read the CA: ${errorMessage(error)}`, {
        cause: error,
      });
    }
    if (this.connection && !ca.changed) return acquire(this.connection);

    const previous = this.connection;
    if (previous) {
      previous.retired = true;
      closeIfDone(previous);
    }

    const sessionManager = new Http2SessionManager(
      baseUrl,
      { pingIntervalMs: PING_INTERVAL_MS },
      { ca: ca.pem, servername: baseUrl.hostname, ...(this.lookup && { lookup: this.lookup }) }
    );
    const transport = createGrpcTransport({ baseUrl: baseUrl.toString(), sessionManager });
    this.connection = { client: createClient(Control, transport), sessionManager, activeCalls: 0, retired: false };
    return acquire(this.connection);
  }
}

/** Counts a call on the connection. Runs in the synchronous step that selects the connection, before any await. */
function acquire(connection: Connection): Connection {
  connection.activeCalls++;
  return connection;
}

/** Closes a retired connection once its last call ends. */
function closeIfDone(connection: Connection): void {
  if (connection.retired && connection.activeCalls === 0) connection.sessionManager.abort();
}

function parseUrl(value: string): URL | AgentSubstrateSourceError {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return new AgentSubstrateSourceError("other", `AGENT_SUBSTRATE_URL is not a URL: ${value}`);
  }
  if (url.protocol !== "https:") {
    return new AgentSubstrateSourceError("other", `AGENT_SUBSTRATE_URL must use https: ${value}`);
  }
  return url;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
