import "reflect-metadata";
import { mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import http2 from "node:http2";
import type { AddressInfo, LookupFunction } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { Code, ConnectError, type ServiceImpl } from "@connectrpc/connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import * as x509 from "@peculiar/x509";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentSubstrateSourceError } from "../source.js";
import { CaFile } from "./credentials.js";
import { GrpcAgentSubstrateSource } from "./index.js";
import {
  ActorState,
  AtespaceSchema,
  Control,
  ListAtespacesResponseSchema,
  SnapshotFidelity,
  SnapshotStorageState,
  WorkerState,
} from "./gen/ateapi/v1/ateapi_pb.js";

type CaName = "a" | "b";

interface TlsMaterial {
  caCert: string;
  serverKey: string;
  serverCert: string;
}

/** Server certificate names. */
const SERVER_DNS_NAMES = ["localhost", "agent-substrate.test"];
const ECDSA_P256 = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" } as const;

const randomSerial = () => Buffer.from(crypto.getRandomValues(new Uint8Array(8))).toString("hex");

/** A CA and a server certificate it signs, valid for one day. Kept in memory: no key material in the repository. */
async function createTlsMaterial(ca: CaName): Promise<TlsMaterial> {
  const notBefore = new Date(Date.now() - 60_000);
  const notAfter = new Date(Date.now() + 24 * 60 * 60_000);
  const caKeys = await crypto.subtle.generateKey(ECDSA_P256, false, ["sign", "verify"]);
  const caCert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: randomSerial(),
    name: `CN=test-ca-${ca}`,
    notBefore,
    notAfter,
    keys: caKeys,
    signingAlgorithm: ECDSA_P256,
    extensions: [
      new x509.BasicConstraintsExtension(true, undefined, true),
      new x509.KeyUsagesExtension(x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign, true),
      await x509.SubjectKeyIdentifierExtension.create(caKeys.publicKey),
    ],
  });

  const serverKeys = await crypto.subtle.generateKey(ECDSA_P256, true, ["sign", "verify"]);
  const serverCert = await x509.X509CertificateGenerator.create({
    serialNumber: randomSerial(),
    subject: "CN=localhost",
    issuer: caCert.subject,
    notBefore,
    notAfter,
    publicKey: serverKeys.publicKey,
    signingKey: caKeys.privateKey,
    signingAlgorithm: ECDSA_P256,
    extensions: [
      new x509.BasicConstraintsExtension(false),
      new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature, true),
      new x509.ExtendedKeyUsageExtension([x509.ExtendedKeyUsage.serverAuth]),
      new x509.SubjectAlternativeNameExtension([
        ...SERVER_DNS_NAMES.map((value) => ({ type: "dns" as const, value })),
        { type: "ip", value: "127.0.0.1" },
      ]),
      await x509.AuthorityKeyIdentifierExtension.create(caKeys.publicKey),
    ],
  });

  return {
    caCert: caCert.toString("pem"),
    serverKey: x509.PemConverter.encode(await crypto.subtle.exportKey("pkcs8", serverKeys.privateKey), "PRIVATE KEY"),
    serverCert: serverCert.toString("pem"),
  };
}

const tls = {} as Record<CaName, TlsMaterial>;

/** Resolves every host to 127.0.0.1. */
const loopbackLookup: LookupFunction = (_hostname, options, callback) => {
  if (options.all) callback(null, [{ address: "127.0.0.1", family: 4 }]);
  else callback(null, "127.0.0.1", 4);
};

type ControlImpl = Partial<ServiceImpl<typeof Control>>;

interface TestServer {
  url: string;
  /** Authorization header of each request, in order. */
  authorizations: (string | null)[];
  useCertificate(ca: CaName): void;
  /** Ends every open HTTP/2 session with GOAWAY. */
  closeSessions(): void;
  close(): Promise<void>;
}

async function startServer(impl: ControlImpl, ca: CaName = "a"): Promise<TestServer> {
  const authorizations: (string | null)[] = [];
  const recordingImpl = Object.fromEntries(
    Object.entries(impl).map(([method, fn]) => [
      method,
      (req: unknown, ctx: { requestHeader: Headers }) => {
        authorizations.push(ctx.requestHeader.get("authorization"));
        return (fn as (req: unknown, ctx: unknown) => unknown)(req, ctx);
      },
    ])
  ) as ControlImpl;

  const handler = connectNodeAdapter({
    grpc: true,
    connect: false,
    grpcWeb: false,
    routes: (router) => router.service(Control, recordingImpl),
  });
  const server = http2.createSecureServer({ key: tls[ca].serverKey, cert: tls[ca].serverCert }, handler);
  const sessions = new Set<http2.ServerHttp2Session>();
  server.on("session", (session) => {
    sessions.add(session);
    session.on("close", () => sessions.delete(session));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `https://localhost:${port}`,
    authorizations,
    useCertificate(next) {
      server.setSecureContext({ key: tls[next].serverKey, cert: tls[next].serverCert });
    },
    closeSessions() {
      for (const session of sessions) session.close();
    },
    close: () =>
      new Promise<void>((resolve) => {
        for (const session of sessions) session.destroy();
        server.close(() => resolve());
      }),
  };
}

describe("GrpcAgentSubstrateSource", () => {
  let dir: string;
  let tokenFile: string;
  let caFile: string;
  let server: TestServer | undefined;
  let source: GrpcAgentSubstrateSource | undefined;

  /** Replaces the file the way the kubelet does: write aside, then rename over it. */
  async function replaceFile(file: string, content: string) {
    const next = `${file}.next`;
    await writeFile(next, content);
    await rename(next, file);
  }

  beforeAll(async () => {
    [tls.a, tls.b] = await Promise.all([createTlsMaterial("a"), createTlsMaterial("b")]);
  });

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "agent-substrate-"));
    tokenFile = path.join(dir, "token");
    caFile = path.join(dir, "ca.crt");
    await writeFile(tokenFile, "token-one\n");
    await writeFile(caFile, tls.a.caCert);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    source?.close();
    source = undefined;
    await server?.close();
    server = undefined;
    await rm(dir, { recursive: true, force: true });
  });

  it("lists atespaces with the bearer token from the token file", async () => {
    server = await startServer({
      listAtespaces: () =>
        create(ListAtespacesResponseSchema, {
          atespaces: [
            create(AtespaceSchema, {
              metadata: {
                name: "krci-agents",
                uid: "8f1c",
                createTime: timestampFromDate(new Date("2026-11-10T08:00:00Z")),
              },
            }),
          ],
        }),
    });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });

    await expect(source.listAtespaces()).resolves.toEqual([
      { name: "krci-agents", uid: "8f1c", createTime: "2026-11-10T08:00:00.000Z" },
    ]);
    expect(server.authorizations).toEqual(["Bearer token-one"]);
  });

  it("reads every page of actors across all atespaces and keeps an actor seen on two pages once", async () => {
    const requests: { atespace: string; pageSize: number; pageToken: string }[] = [];
    const actor = (name: string, uid: string) => ({ metadata: { atespace: "krci-agents", name, uid } });
    const pages: Record<string, { actors: ReturnType<typeof actor>[]; nextPageToken: string }> = {
      "": { actors: [actor("issue-2-25", "u1"), actor("issue-2-26", "u2")], nextPageToken: "p2" },
      p2: { actors: [actor("issue-2-26", "u2"), actor("issue-5-3", "u3")], nextPageToken: "p3" },
      p3: { actors: [], nextPageToken: "" },
    };
    server = await startServer({
      listActors: (req) => {
        requests.push({
          atespace: req.atespace,
          pageSize: req.options?.pageSize ?? 0,
          pageToken: req.options?.pageToken ?? "",
        });
        return pages[req.options?.pageToken ?? ""];
      },
    });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });

    const actors = await source.listActors();

    expect(actors.map((a) => a.name)).toEqual(["issue-2-25", "issue-2-26", "issue-5-3"]);
    expect(requests).toEqual([
      { atespace: "", pageSize: 1000, pageToken: "" },
      { atespace: "", pageSize: 1000, pageToken: "p2" },
      { atespace: "", pageSize: 1000, pageToken: "p3" },
    ]);
  });

  it("maps an actor with its state, worker assignment, crash and snapshots", async () => {
    server = await startServer({
      listActors: () => ({
        actors: [
          {
            metadata: {
              atespace: "krci-agents",
              name: "issue-2-25",
              uid: "u1",
              createTime: timestampFromDate(new Date("2026-11-16T16:19:04Z")),
              updateTime: timestampFromDate(new Date("2026-11-16T16:52:03Z")),
            },
            actorTemplate: { atespace: "krci-agents", name: "issue-2-25" },
            status: {
              state: ActorState.RUNNING,
              workerAssignment: {
                worker: { name: "827d5090" },
                workerPool: "workers",
                workerNamespace: "krci-agents",
                workerPod: "workers-b98954c58-h8kx8",
                nodeName: "krci-control-plane",
                sandboxRuntime: { sandboxClass: "gvisor" },
              },
              crash: { message: "wakeup probe failed", crashTime: timestampFromDate(new Date("2026-11-16T17:00:00Z")) },
              snapshots: [
                {
                  uuid: "s1",
                  generation: 1,
                  fidelity: SnapshotFidelity.MEMORY,
                  locality: "krci-control-plane",
                  durableSnapshot: { state: SnapshotStorageState.PENDING, object: { snapshotUri: "gs://bucket/s1" } },
                },
                { uuid: "s2", generation: 2, fidelity: SnapshotFidelity.UNSPECIFIED },
              ],
            },
          },
          { metadata: { atespace: "krci-agents", name: "no-status", uid: "u2" } },
          {
            metadata: { atespace: "krci-agents", name: "future-state", uid: "u3" },
            status: { state: 42 as ActorState },
          },
        ],
      }),
    });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });

    const [running, noStatus, futureState] = await source.listActors();

    expect(running).toEqual({
      atespace: "krci-agents",
      name: "issue-2-25",
      uid: "u1",
      createTime: "2026-11-16T16:19:04.000Z",
      updateTime: "2026-11-16T16:52:03.000Z",
      actorTemplate: { atespace: "krci-agents", name: "issue-2-25" },
      state: "running",
      workerAssignment: {
        worker: "827d5090",
        workerPool: "workers",
        workerNamespace: "krci-agents",
        workerPod: "workers-b98954c58-h8kx8",
        nodeName: "krci-control-plane",
        sandboxRuntime: "gvisor",
      },
      crash: { message: "wakeup probe failed", crashTime: "2026-11-16T17:00:00.000Z" },
      snapshots: [
        { uuid: "s1", generation: 1, fidelity: "memory", locality: "krci-control-plane", durableState: "pending" },
        { uuid: "s2", generation: 2, fidelity: "unknown", locality: null, durableState: "none" },
      ],
    });
    expect(noStatus.state).toBe("unknown");
    expect(noStatus.workerAssignment).toBeNull();
    expect(noStatus.crash).toBeNull();
    expect(futureState.state).toBe("transitional");
  });

  it("gets an actor template by atespace and name", async () => {
    const refs: unknown[] = [];
    server = await startServer({
      getActorTemplate: (req) => {
        refs.push({ atespace: req.actorTemplate?.atespace, name: req.actorTemplate?.name });
        return {
          metadata: { atespace: "krci-agents", name: "issue-2-25", uid: "t1" },
          containers: [{ name: "claude", env: [{ name: "PROJECT_PATH", value: "krci/test-go-app" }] }],
          resources: { limits: { cpuMillicores: 1000n, memoryBytes: 2147483648n } },
        };
      },
    });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });

    await expect(source.getActorTemplate({ atespace: "krci-agents", name: "issue-2-25" })).resolves.toEqual({
      atespace: "krci-agents",
      name: "issue-2-25",
      uid: "t1",
      containers: [{ name: "claude", env: [{ name: "PROJECT_PATH", value: "krci/test-go-app" }] }],
      limits: { cpuMillicores: 1000, memoryBytes: 2147483648 },
    });
    expect(refs).toEqual([{ atespace: "krci-agents", name: "issue-2-25" }]);
  });

  it("lists workers with state, capacity, allocation and sandbox classes", async () => {
    server = await startServer({
      listWorkers: () => ({
        workers: [
          {
            metadata: { name: "827d5090" },
            workerPool: "workers",
            workerNamespace: "krci-agents",
            workerPod: "workers-b98954c58-h8kx8",
            nodeName: "krci-control-plane",
            status: {
              state: WorkerState.DRAINING,
              capacity: { cpuMillicores: 1000n, memoryBytes: 2617245696n, actors: 1000 },
              sandboxClasses: [{ sandboxClass: "gvisor" }],
            },
          },
          { metadata: { name: "no-status" } },
        ],
      }),
    });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });

    await expect(source.listWorkers()).resolves.toEqual([
      {
        name: "827d5090",
        workerPool: "workers",
        workerNamespace: "krci-agents",
        workerPod: "workers-b98954c58-h8kx8",
        nodeName: "krci-control-plane",
        state: "draining",
        capacity: { cpuMillicores: 1000, memoryBytes: 2617245696, actors: 1000 },
        allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
        sandboxClasses: ["gvisor"],
      },
      {
        name: "no-status",
        workerPool: "",
        workerNamespace: "",
        workerPod: "",
        nodeName: "",
        state: "unknown",
        capacity: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
        allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
        sandboxClasses: [],
      },
    ]);
  });

  it("sends a new token once the cached one is 60 s old", async () => {
    let now = Date.UTC(2026, 10, 22, 10, 0, 0);
    server = await startServer({ listAtespaces: () => ({}) });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile, now: () => now });

    await source.listAtespaces();
    await replaceFile(tokenFile, "token-two\n");
    now += 59_000;
    await source.listAtespaces();
    now += 1_000;
    await source.listAtespaces();

    expect(server.authorizations).toEqual(["Bearer token-one", "Bearer token-one", "Bearer token-two"]);
  });

  it("rejects with unauthenticated when the token file is missing or empty, without a call", async () => {
    server = await startServer({ listAtespaces: () => ({}) });

    await rm(tokenFile);
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });
    await expect(source.listAtespaces()).rejects.toMatchObject({ kind: "unauthenticated" });

    await writeFile(tokenFile, "  \n");
    await expect(source.listAtespaces()).rejects.toMatchObject({ kind: "unauthenticated" });
    expect(server.authorizations).toEqual([]);
  });

  it("reloads the CA when the file changes and reconnects to a server with a rotated certificate", async () => {
    server = await startServer({ listAtespaces: () => ({}) }, "a");
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });
    await source.listAtespaces();

    server.useCertificate("b");
    server.closeSessions();
    await replaceFile(caFile, tls.b.caCert);

    await expect(source.listAtespaces()).resolves.toEqual([]);
  });

  it("rejects with unavailable when the server certificate does not chain to the CA, then recovers after a CA change", async () => {
    server = await startServer({ listAtespaces: () => ({}) }, "a");
    await writeFile(caFile, tls.b.caCert);
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });

    await expect(source.listAtespaces()).rejects.toMatchObject({ kind: "unavailable" });

    await replaceFile(caFile, tls.a.caCert);
    await expect(source.listAtespaces()).resolves.toEqual([]);
  });

  it("verifies the server certificate against the URL host, not the address the lookup returns", async () => {
    server = await startServer({ listAtespaces: () => ({}) });
    const { port } = new URL(server.url);

    source = new GrpcAgentSubstrateSource({
      url: `https://agent-substrate.test:${port}`,
      tokenFile,
      caFile,
      lookup: loopbackLookup,
    });
    await expect(source.listAtespaces()).resolves.toEqual([]);
    source.close();

    source = new GrpcAgentSubstrateSource({
      url: `https://other-host.test:${port}`,
      tokenFile,
      caFile,
      lookup: loopbackLookup,
    });
    await expect(source.listAtespaces()).rejects.toMatchObject({
      kind: "unavailable",
      message: expect.stringContaining("other-host.test"),
    });
  });

  it("completes a call on the connection it selected when a concurrent call sees a CA change", async () => {
    server = await startServer({ listAtespaces: () => ({}) }, "a");
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });
    await source.listAtespaces();
    // New TLS handshakes get the certificate of CA b; the open session keeps CA a.
    server.useCertificate("b");

    const pendingReads: ((ca: { pem: string; changed: boolean }) => void)[] = [];
    let bothReadsPending!: () => void;
    const bothReadsPendingPromise = new Promise<void>((resolve) => {
      bothReadsPending = resolve;
    });
    vi.spyOn(CaFile.prototype, "read").mockImplementation(
      () =>
        new Promise((resolve) => {
          pendingReads.push(resolve);
          if (pendingReads.length === 2) bothReadsPending();
        })
    );

    const first = source.listAtespaces();
    const second = source.listAtespaces();
    await bothReadsPendingPromise;
    // Same tick: the first call selects the open connection, then the second call retires it.
    pendingReads[0]({ pem: tls.a.caCert, changed: false });
    pendingReads[1]({ pem: tls.b.caCert, changed: true });

    await expect(Promise.all([first, second])).resolves.toEqual([[], []]);
    expect(server.authorizations).toHaveLength(3);
  });

  it("keeps the open connection when the CA file becomes unreadable", async () => {
    server = await startServer({ listAtespaces: () => ({}) });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });
    await source.listAtespaces();

    await rm(caFile);

    await expect(source.listAtespaces()).resolves.toEqual([]);
  });

  it("rejects with unavailable when the CA file is missing", async () => {
    await rm(caFile);
    source = new GrpcAgentSubstrateSource({ url: "https://localhost:1", tokenFile, caFile });

    await expect(source.listAtespaces()).rejects.toMatchObject({ kind: "unavailable" });
  });

  it("opens a new connection after the server closes the previous one", async () => {
    server = await startServer({ listAtespaces: () => ({}) });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });
    await source.listAtespaces();

    server.closeSessions();
    await new Promise((resolve) => setTimeout(resolve, 50));

    await expect(source.listAtespaces()).resolves.toEqual([]);
    expect(server.authorizations).toHaveLength(2);
  });

  it("rejects with unavailable when nothing listens at the URL", async () => {
    server = await startServer({});
    const { url } = server;
    await server.close();
    server = undefined;
    source = new GrpcAgentSubstrateSource({ url, tokenFile, caFile });

    await expect(source.listAtespaces()).rejects.toMatchObject({ kind: "unavailable" });
  });

  it.each([
    [Code.Unauthenticated, "unauthenticated"],
    [Code.PermissionDenied, "permissionDenied"],
    [Code.Unavailable, "unavailable"],
    [Code.NotFound, "notFound"],
    [Code.Internal, "other"],
  ] as const)("maps gRPC code %s to the %s error", async (code, kind) => {
    server = await startServer({
      listWorkers: () => {
        throw new ConnectError("denied by the server", code);
      },
    });
    source = new GrpcAgentSubstrateSource({ url: server.url, tokenFile, caFile });

    const error = await source.listWorkers().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AgentSubstrateSourceError);
    expect(error).toMatchObject({ kind, message: expect.stringContaining("denied by the server") });
  });

  it.each(["http://localhost:443", "not a url"])("rejects every call with other for the URL %s", async (url) => {
    source = new GrpcAgentSubstrateSource({ url, tokenFile, caFile });

    await expect(source.listActors()).rejects.toMatchObject({ kind: "other" });
  });
});
