import {
  appRouter,
  createCaller,
  type CustomSession,
  createContext,
  type RouterInput,
} from "@my-project/trpc";
import { k8sCodebaseConfig } from "@my-project/shared";
import {
  classifyBranchResolution,
  clampPageSize,
  componentMatchesSeverity,
  fetchAllComponents,
  isScaNotConfiguredError,
  latestMetricsSnapshot,
  paginate,
  parseBoolQuery,
  parseSeverityCsv,
  SCA_PAGE_SIZE_MAX,
  SCA_PAGE_SIZE_MAX_PAGES,
  sortFindings,
  toZeroIndexedPage,
  truncateFindings,
  type ResolvedBranch,
} from "./sca-helpers.js";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { STATUS_CODES } from "node:http";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { DBSessionStore } from "@/clients/db-session-store";

/**
 * The element type of the `components` array returned by the DependencyTrack
 * `getComponents` tRPC procedure. Declared once here so the severity-filter
 * branch and related helpers share the same type without repeating the
 * `Awaited<ReturnType<...>>` unwrapping at every call site.
 */
type DtComponents = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof createCaller>["dependencyTrack"]["getComponents"]
    >
  >["components"]
>;

interface OidcConfig {
  issuerURL: string;
  clientID: string;
  clientSecret: string;
  scope: string;
  codeChallengeMethod: string;
}

interface RegisterOpenApiOptions {
  sessionStore: DBSessionStore;
  oidcConfig: OidcConfig;
  portalUrl: string;
}

/**
 * Registers REST endpoints that proxy to tRPC procedures via createCaller.
 *
 * Why hand-written routes instead of fastifyTRPCOpenApiPlugin?
 * The built-in Fastify adapter from trpc-to-openapi@2.4.0 is incompatible
 * with @trpc/server@11.x — it passes Fastify request objects where tRPC
 * expects Node.js IncomingMessage, causing "req.once is not a function"
 * crashes. createCaller is tRPC's first-party server-side caller and
 * invokes procedures in-process without any adapter layer.
 *
 * TODO: replace all hand-written routes below with a single
 * fastify.register(fastifyTRPCOpenApiPlugin, ...) call once trpc-to-openapi
 * ships tRPC v11 support. The REST contract (paths, methods, JSON shapes)
 * must stay the same. Track: https://github.com/mcampa/trpc-to-openapi/issues
 */
export function registerOpenApi(
  fastify: FastifyInstance,
  opts: RegisterOpenApiOptions
) {
  const { sessionStore, oidcConfig, portalUrl } = opts;

  async function buildCaller(req: FastifyRequest, res: FastifyReply) {
    const session = req.session as CustomSession;
    const ctx = await createContext({
      req,
      res,
      session,
      sessionStore,
      oidcConfig,
      portalUrl,
    });
    return createCaller(ctx);
  }

  /**
   * Maps TRPCError codes to proper HTTP status codes.
   * Without this, Fastify's default error handler returns 500 for all
   * tRPC errors (e.g. UNAUTHORIZED would surface as HTTP 500 instead of 401).
   * TODO: this helper can be deleted once fastifyTRPCOpenApiPlugin handles
   * error mapping natively.
   */
  function handleTRPCError(error: unknown, res: FastifyReply): never {
    if (error instanceof TRPCError) {
      const httpStatus = getHTTPStatusCodeFromError(error);
      // Derive both fields from safe, static sources — never expose error.message or stack.
      // `code` is a tRPC enum literal (e.g. "UNAUTHORIZED"); `message` is the HTTP status phrase.
      const code: string = error.code;
      const message = STATUS_CODES[httpStatus] ?? "Unknown error";
      res.status(httpStatus).send({ error: { code, message } });
    }
    throw error;
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  // GET /rest/v1/config/oidc (public — no auth required, used for OIDC discovery before login)
  fastify.get("/rest/v1/config/oidc", async (req, res) => {
    try {
      const caller = await buildCaller(req, res);
      return await caller.config.oidc();
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // GET /rest/v1/config (protected)
  fastify.get("/rest/v1/config", async (req, res) => {
    try {
      const caller = await buildCaller(req, res);
      return await caller.config.get();
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // ---------------------------------------------------------------------------
  // Kubernetes resources
  // ---------------------------------------------------------------------------

  // POST /rest/v1/resources/list (protected)
  fastify.post<{ Body: RouterInput["k8s"]["list"] }>(
    "/rest/v1/resources/list",
    async (req, res) => {
      try {
        const caller = await buildCaller(req, res);
        return await caller.k8s.list(req.body);
      } catch (error) {
        return handleTRPCError(error, res);
      }
    }
  );

  // POST /rest/v1/resources/get (protected)
  fastify.post<{ Body: RouterInput["k8s"]["get"] }>(
    "/rest/v1/resources/get",
    async (req, res) => {
      try {
        const caller = await buildCaller(req, res);
        return await caller.k8s.get(req.body);
      } catch (error) {
        return handleTRPCError(error, res);
      }
    }
  );

  // ---------------------------------------------------------------------------
  // Tekton Results
  // ---------------------------------------------------------------------------

  // GET /rest/v1/pipeline-runs (protected)
  fastify.get<{
    Querystring: {
      namespace: string;
      pageSize?: string;
      pageToken?: string;
      filter?: string;
    };
  }>("/rest/v1/pipeline-runs", async (req, res) => {
    try {
      const caller = await buildCaller(req, res);
      const { namespace, pageSize, pageToken, filter } = req.query;
      return await caller.tektonResults.getPipelineRunResults({
        namespace,
        pageSize: pageSize ? Number(pageSize) : undefined,
        pageToken: pageToken || undefined,
        filter: filter || undefined,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // GET /rest/v1/pipeline-runs/:resultUid/logs (protected)
  fastify.get<{
    Params: { resultUid: string };
    Querystring: { namespace: string; recordUid: string };
  }>("/rest/v1/pipeline-runs/:resultUid/logs", async (req, res) => {
    try {
      const caller = await buildCaller(req, res);
      return await caller.tektonResults.getPipelineRunLogs({
        namespace: req.query.namespace,
        resultUid: req.params.resultUid,
        recordUid: req.query.recordUid,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // GET /rest/v1/pipeline-runs/:resultUid/task-runs (protected)
  fastify.get<{
    Params: { resultUid: string };
    Querystring: { namespace: string };
  }>("/rest/v1/pipeline-runs/:resultUid/task-runs", async (req, res) => {
    try {
      const caller = await buildCaller(req, res);
      return await caller.tektonResults.getTaskRunRecords({
        namespace: req.query.namespace,
        resultUid: req.params.resultUid,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // GET /rest/v1/task-runs/:resultUid/logs (protected)
  fastify.get<{
    Params: { resultUid: string };
    Querystring: { namespace: string; taskRunName: string; stepName?: string };
  }>("/rest/v1/task-runs/:resultUid/logs", async (req, res) => {
    try {
      const caller = await buildCaller(req, res);
      return await caller.tektonResults.getTaskRunLogs({
        namespace: req.query.namespace,
        resultUid: req.params.resultUid,
        taskRunName: req.query.taskRunName,
        stepName: req.query.stepName || undefined,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // ---------------------------------------------------------------------------
  // SonarQube — view proxies for `krci sonar`
  // ---------------------------------------------------------------------------

  // TODO: parsePositiveIntQuery and all manual query-string coercion below can
  // be deleted once fastifyTRPCOpenApiPlugin handles input parsing automatically.
  // Parses a positive-integer query string. Returns `undefined` when absent,
  // or a typed marker when the value is present but not a positive integer so
  // the caller can emit a 400.
  const parsePositiveIntQuery = (
    raw: string | undefined
  ): number | undefined | "invalid" => {
    if (raw === undefined) return undefined;
    if (!/^[1-9]\d*$/.test(raw)) return "invalid";
    return Number(raw);
  };

  // GET /rest/v1/sonar/list (protected) — proxies sonarqube.getProjects
  fastify.get<{
    Querystring: {
      page?: string;
      pageSize?: string;
      searchTerm?: string;
    };
  }>("/rest/v1/sonar/list", async (req, res) => {
    try {
      const { page, pageSize, searchTerm } = req.query;
      const parsedPage = parsePositiveIntQuery(page);
      const parsedPageSize = parsePositiveIntQuery(pageSize);
      if (parsedPage === "invalid") {
        return res.code(400).send({ error: "page must be a positive integer" });
      }
      if (parsedPageSize === "invalid") {
        return res
          .code(400)
          .send({ error: "pageSize must be a positive integer" });
      }

      const caller = await buildCaller(req, res);
      return await caller.sonarqube.getProjects({
        page: parsedPage,
        pageSize: parsedPageSize,
        searchTerm: searchTerm || undefined,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // GET /rest/v1/sonar/get (protected) — proxies sonarqube.getProject
  fastify.get<{
    Querystring: {
      projectKey: string;
      pullRequest?: string;
      branch?: string;
    };
  }>("/rest/v1/sonar/get", async (req, res) => {
    try {
      const { projectKey, pullRequest, branch } = req.query;
      if (!projectKey) {
        return res.code(400).send({ error: "projectKey is required" });
      }

      const caller = await buildCaller(req, res);
      return await caller.sonarqube.getProject({
        componentKey: projectKey,
        pullRequest: pullRequest || undefined,
        branch: branch || undefined,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // GET /rest/v1/sonar/gate (protected) — proxies sonarqube.getQualityGateDetails
  fastify.get<{
    Querystring: {
      projectKey: string;
      pullRequest?: string;
      branch?: string;
    };
  }>("/rest/v1/sonar/gate", async (req, res) => {
    try {
      const { projectKey, pullRequest, branch } = req.query;
      if (!projectKey) {
        return res.code(400).send({ error: "projectKey is required" });
      }

      const caller = await buildCaller(req, res);
      return await caller.sonarqube.getQualityGateDetails({
        projectKey,
        pullRequest: pullRequest || undefined,
        branch: branch || undefined,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // GET /rest/v1/sonar/issues (protected) — proxies sonarqube.getProjectIssues
  fastify.get<{
    Querystring: {
      projectKey: string;
      pullRequest?: string;
      branch?: string;
      types?: string;
      severities?: string;
      statuses?: string;
      resolved?: "true" | "false";
      s?: string;
      asc?: "true" | "false";
      p?: string;
      ps?: string;
    };
  }>("/rest/v1/sonar/issues", async (req, res) => {
    try {
      const {
        projectKey,
        pullRequest,
        branch,
        types,
        severities,
        statuses,
        resolved,
        s,
        asc,
        p,
        ps,
      } = req.query;
      if (!projectKey) {
        return res.code(400).send({ error: "projectKey is required" });
      }
      const parsedP = parsePositiveIntQuery(p);
      const parsedPs = parsePositiveIntQuery(ps);
      if (parsedP === "invalid") {
        return res.code(400).send({ error: "p must be a positive integer" });
      }
      if (parsedPs === "invalid") {
        return res.code(400).send({ error: "ps must be a positive integer" });
      }

      const caller = await buildCaller(req, res);
      return await caller.sonarqube.getProjectIssues({
        componentKeys: projectKey,
        pullRequest: pullRequest || undefined,
        branch: branch || undefined,
        types,
        severities,
        statuses,
        resolved,
        s,
        asc,
        p: parsedP,
        ps: parsedPs,
      });
    } catch (error) {
      return handleTRPCError(error, res);
    }
  });

  // ---------------------------------------------------------------------------
  // Dependency-Track — view proxies for `krci sca`
  // ---------------------------------------------------------------------------

  // Attempt to classify a thrown error. TRPCErrors (e.g. UNAUTHORIZED) go
  // through `handleTRPCError` so the caller gets the correct status. Any other
  // error originating from the Dep-Track client is translated to 502 Bad
  // Gateway; upstream-unconfigured TRPCErrors (INTERNAL_SERVER_ERROR whose
  // message mentions the DT env vars) are translated to 503.
  const handleScaError = (error: unknown, res: FastifyReply): never => {
    if (isScaNotConfiguredError(error)) {
      res.status(503).send({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Dependency-Track integration is not configured",
        },
      });
      throw error;
    }
    if (error instanceof TRPCError) {
      return handleTRPCError(error, res);
    }
    // Non-TRPCError thrown from DT client (network / 5xx / timeout) → 502.
    const message =
      error instanceof Error
        ? error.message
        : "Dependency-Track request failed";
    res.status(502).send({ error: { code: "BAD_GATEWAY", message } });
    throw error;
  };

  // Resolves the Dep-Track `version` value for a given codebase. When the
  // caller supplies `branch`, that value is returned verbatim. When `branch`
  // is empty/undefined, the Codebase CR is read via the same in-process
  // caller the UI uses (`caller.k8s.get`) and `spec.defaultBranch` is
  // returned. The Portal's default cluster/namespace come from the same env
  // vars that power `caller.config.get()`, so the CLI does not need to know
  // or send them.
  async function resolveBranch(
    caller: Awaited<ReturnType<typeof buildCaller>>,
    codebase: string,
    branch?: string
  ): Promise<ResolvedBranch> {
    const clusterName = process.env.DEFAULT_CLUSTER_NAME || "";
    const namespace = process.env.DEFAULT_CLUSTER_NAMESPACE || "";

    return classifyBranchResolution(branch, async () =>
      caller.k8s.get({
        clusterName,
        namespace,
        name: codebase,
        resourceConfig: k8sCodebaseConfig,
      })
    );
  }

  function sendResolveBranchFailure(
    res: FastifyReply,
    failure: Extract<ResolvedBranch, { ok: false }>,
    codebase: string
  ) {
    const body =
      failure.reason === "codebase_not_found"
        ? {
            reason: failure.reason,
            message: `Codebase '${codebase}' not found`,
          }
        : {
            reason: failure.reason,
            message: `Codebase '${codebase}' has no spec.defaultBranch configured`,
          };
    return res.code(404).send(body);
  }

  // GET /rest/v1/sca/list (protected) — proxies dependencyTrack.getProjects
  fastify.get<{
    Querystring: {
      pageNumber?: string;
      pageSize?: string;
      searchTerm?: string;
      onlyRoot?: "true" | "false";
      excludeInactive?: "true" | "false";
    };
  }>("/rest/v1/sca/list", async (req, res) => {
    try {
      const { pageNumber, pageSize, searchTerm, onlyRoot, excludeInactive } =
        req.query;
      const parsedPageNumber = parsePositiveIntQuery(pageNumber);
      const parsedPageSize = parsePositiveIntQuery(pageSize);
      if (parsedPageNumber === "invalid") {
        return res
          .code(400)
          .send({ error: "pageNumber must be a positive integer" });
      }
      if (parsedPageSize === "invalid") {
        return res
          .code(400)
          .send({ error: "pageSize must be a positive integer" });
      }

      const caller = await buildCaller(req, res);
      // CLI is 1-indexed (matches sonar). tRPC procedure is 0-indexed. Subtract 1.
      // Clamp pageSize to the procedure ceiling.
      const result = await caller.dependencyTrack.getProjects({
        pageNumber: toZeroIndexedPage(parsedPageNumber),
        pageSize: clampPageSize(parsedPageSize),
        searchTerm: searchTerm || undefined,
        onlyRoot: parseBoolQuery(onlyRoot) ?? true,
        excludeInactive: parseBoolQuery(excludeInactive) ?? true,
      });

      return {
        items: result.projects ?? [],
        totalCount: result.totalCount ?? 0,
      };
    } catch (error) {
      return handleScaError(error, res);
    }
  });

  // GET /rest/v1/sca/get (protected) — proxies dependencyTrack.getProjectByNameAndVersion + getProjectMetrics
  fastify.get<{
    Querystring: {
      codebase: string;
      branch?: string;
    };
  }>("/rest/v1/sca/get", async (req, res) => {
    try {
      const { codebase, branch } = req.query;
      if (!codebase) {
        return res.code(400).send({ error: "codebase is required" });
      }

      const caller = await buildCaller(req, res);
      const resolved = await resolveBranch(
        caller,
        codebase,
        branch || undefined
      );
      if (!resolved.ok) {
        return sendResolveBranchFailure(res, resolved, codebase);
      }

      const project = await caller.dependencyTrack.getProjectByNameAndVersion({
        projectName: codebase,
        defaultBranch: resolved.branch,
      });

      if (!project) {
        return { status: "NONE" as const };
      }

      // `getProjectMetrics` returns a time series; the CLI wants the latest snapshot.
      const series = await caller.dependencyTrack.getProjectMetrics({
        uuid: project.uuid,
      });
      const latestMetrics = latestMetricsSnapshot(series);

      return {
        status: "OK" as const,
        project: {
          ...project,
          version: resolved.branch,
        },
        metrics: latestMetrics,
      };
    } catch (error) {
      return handleScaError(error, res);
    }
  });

  // GET /rest/v1/sca/components (protected) — proxies dependencyTrack.getComponents
  fastify.get<{
    Querystring: {
      codebase: string;
      branch?: string;
      pageNumber?: string;
      pageSize?: string;
      onlyOutdated?: "true" | "false";
      onlyDirect?: "true" | "false";
      severity?: string;
    };
  }>("/rest/v1/sca/components", async (req, res) => {
    try {
      const {
        codebase,
        branch,
        pageNumber,
        pageSize,
        onlyOutdated,
        onlyDirect,
        severity,
      } = req.query;
      if (!codebase) {
        return res.code(400).send({ error: "codebase is required" });
      }
      const parsedPageNumber = parsePositiveIntQuery(pageNumber);
      const parsedPageSize = parsePositiveIntQuery(pageSize);
      if (parsedPageNumber === "invalid") {
        return res
          .code(400)
          .send({ error: "pageNumber must be a positive integer" });
      }
      if (parsedPageSize === "invalid") {
        return res
          .code(400)
          .send({ error: "pageSize must be a positive integer" });
      }

      const parsedSeverity = parseSeverityCsv(severity);
      if (parsedSeverity === "invalid") {
        return res.code(400).send({
          error:
            "severity must be a comma-separated list of CRITICAL|HIGH|MEDIUM|LOW|INFO|UNASSIGNED",
        });
      }

      const caller = await buildCaller(req, res);
      const resolved = await resolveBranch(
        caller,
        codebase,
        branch || undefined
      );
      if (!resolved.ok) {
        return sendResolveBranchFailure(res, resolved, codebase);
      }

      const project = await caller.dependencyTrack.getProjectByNameAndVersion({
        projectName: codebase,
        defaultBranch: resolved.branch,
      });

      if (!project) {
        return {
          status: "NONE" as const,
          items: [],
          totalCount: 0,
          truncated: false,
        };
      }

      const { uuid } = project;
      const filterOpts = {
        onlyOutdated: parseBoolQuery(onlyOutdated),
        onlyDirect: parseBoolQuery(onlyDirect),
      };

      if (parsedSeverity) {
        // req.signal fires on client disconnect (tab closed, CLI Ctrl-C) and
        // when Fastify's requestTimeout (30 s) fires. Threading it into
        // fetchAllComponents ensures the auto-paging loop stops promptly rather
        // than continuing to issue Dep-Track requests for a gone connection.
        const { items: all, truncated } = await fetchAllComponents<
          DtComponents[number]
        >(
          (pageNumber, pageSize) =>
            caller.dependencyTrack
              .getComponents({
                uuid,
                pageNumber,
                pageSize,
                onlyOutdated: filterOpts.onlyOutdated,
                onlyDirect: filterOpts.onlyDirect,
              })
              .then((r) => ({
                components: r.components ?? [],
                totalCount: r.totalCount,
              })),
          {
            maxPages: SCA_PAGE_SIZE_MAX_PAGES,
            upstreamPageSize: SCA_PAGE_SIZE_MAX,
            signal: req.signal,
          }
        );

        if (truncated) {
          req.log.warn(
            {
              codebase,
              uuid,
              collected: all.length,
              upstreamTotal: `>${SCA_PAGE_SIZE_MAX_PAGES * SCA_PAGE_SIZE_MAX}`,
            },
            "sca components severity filter hit safety cap — results are truncated"
          );
        }

        const filtered = all.filter((c) =>
          componentMatchesSeverity(c, parsedSeverity)
        );
        const page = paginate(filtered, parsedPageNumber, parsedPageSize);
        return {
          status: "OK" as const,
          items: page.items,
          totalCount: page.totalCount,
          truncated,
        };
      }

      const components = await caller.dependencyTrack.getComponents({
        uuid,
        pageNumber: toZeroIndexedPage(parsedPageNumber),
        pageSize: clampPageSize(parsedPageSize),
        ...filterOpts,
      });

      return {
        status: "OK" as const,
        items: components.components ?? [],
        totalCount: components.totalCount ?? 0,
        truncated: false,
      };
    } catch (error) {
      return handleScaError(error, res);
    }
  });

  // GET /rest/v1/sca/findings (protected) — proxies dependencyTrack.getFindingsByProject
  fastify.get<{
    Querystring: {
      codebase: string;
      branch?: string;
      suppressed?: "true" | "false";
      source?: string;
    };
  }>("/rest/v1/sca/findings", async (req, res) => {
    try {
      const { codebase, branch, suppressed, source } = req.query;
      if (!codebase) {
        return res.code(400).send({ error: "codebase is required" });
      }

      const caller = await buildCaller(req, res);
      const resolved = await resolveBranch(
        caller,
        codebase,
        branch || undefined
      );
      if (!resolved.ok) {
        return sendResolveBranchFailure(res, resolved, codebase);
      }

      const project = await caller.dependencyTrack.getProjectByNameAndVersion({
        projectName: codebase,
        defaultBranch: resolved.branch,
      });

      if (!project) {
        return { status: "NONE" as const, items: [], truncated: false };
      }

      const all = await caller.dependencyTrack.getFindingsByProject({
        uuid: project.uuid,
        suppressed: parseBoolQuery(suppressed),
        source: source || undefined,
      });

      // Deterministic sort per spec §D10, then truncate at SCA_FINDINGS_MAX.
      const sorted = sortFindings(all);
      const { items, truncated } = truncateFindings(sorted);

      return {
        status: "OK" as const,
        items,
        truncated,
      };
    } catch (error) {
      return handleScaError(error, res);
    }
  });

  // ---------------------------------------------------------------------------
  // OpenAPI spec (development only)
  // ---------------------------------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    const openApiDocument = generateOpenApiDocument(appRouter, {
      title: "KubeRocketCI Portal API",
      version: "1.0.0",
      baseUrl: "/rest",
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "OIDC idToken",
        },
      },
    });

    fastify.get("/rest/v1/openapi.json", async () => openApiDocument);
  }
}
