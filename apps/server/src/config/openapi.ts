import {
  appRouter,
  createCaller,
  type CustomSession,
  createContext,
  type RouterInput,
} from "@my-project/trpc";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { STATUS_CODES } from "node:http";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { DBSessionStore } from "@/clients/db-session-store";

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
 * When trpc-to-openapi ships a fix for tRPC v11, these routes can be
 * replaced with a single fastify.register(fastifyTRPCOpenApiPlugin, ...)
 * call. The REST contract (paths, methods, JSON shapes) stays the same.
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
    };
  }>("/rest/v1/sonar/get", async (req, res) => {
    try {
      const { projectKey, pullRequest } = req.query;
      if (!projectKey) {
        return res.code(400).send({ error: "projectKey is required" });
      }

      const caller = await buildCaller(req, res);
      return await caller.sonarqube.getProject({
        componentKey: projectKey,
        pullRequest,
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
    };
  }>("/rest/v1/sonar/gate", async (req, res) => {
    try {
      const { projectKey, pullRequest } = req.query;
      if (!projectKey) {
        return res.code(400).send({ error: "projectKey is required" });
      }

      const caller = await buildCaller(req, res);
      return await caller.sonarqube.getQualityGateDetails({
        projectKey,
        pullRequest,
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
        pullRequest,
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
