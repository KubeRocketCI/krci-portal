import { DBSessionStore } from "@/clients/db-session-store";
import {
  appRouter,
  type AppRouter,
  type CustomSession,
  createContext,
} from "@my-project/trpc";
import FastifyCookie from "@fastify/cookie";
import FastifyCors from "@fastify/cors";
import FastifySession from "@fastify/session";
import FastifyWebsocket from "@fastify/websocket";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify, { FastifyInstance, FastifyRequest } from "fastify";
import { IncomingMessage } from "http";
import { maskEnvValue } from "../env-utils";

export class LocalFastifyServer {
  fastify: FastifyInstance;

  constructor() {
    LocalFastifyServer.validateRequiredEnv([
      "LOCAL_CLIENT_ORIGIN",
      "API_PREFIX",
      "SERVER_SECRET",
      "SERVER_PORT",
      "OIDC_ISSUER_URL",
      "OIDC_CLIENT_ID",
      "OIDC_CLIENT_SECRET",
      "OIDC_SCOPE",
      "OIDC_CODE_CHALLENGE_METHOD",
      "TEKTON_RESULTS_URL",
    ]);

    this.fastify = Fastify({ logger: false });
  }

  static validateRequiredEnv(keys: string[]) {
    for (const key of keys) {
      const value = process.env[key];
      console.log(`${key}: ${maskEnvValue(key, value)}`);
      if (!value) {
        throw new Error(`Missing required ${key} environment variable`);
      }
    }
  }

  private registerPlugins() {
    const sessionStore = new DBSessionStore();

    if (process.env.NODE_ENV === "development") {
      sessionStore.clearAllSessions();
      console.log("🧹 Cleared all sessions for development");
    }

    this.fastify.register(FastifyCors, {
      origin: process.env.LOCAL_CLIENT_ORIGIN,
      credentials: true,
    });

    this.fastify.register(FastifyWebsocket, {
      prefix: process.env.API_PREFIX,
    });
    this.fastify.register(FastifyCookie, {
      secret: process.env.SERVER_SECRET,
      parseOptions: {},
    });
    this.fastify.register(FastifySession, {
      secret: process.env.SERVER_SECRET!,
      store: sessionStore,
      cookie: {
        secure: "auto",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: "lax",
      },
      saveUninitialized: false,
    });

    // const publicPath =
    //   process.env.DEPLOY_CLIENT_DIST_DIR! || fromMonorepoRoot("/apps/client/dist");
    // console.log("Serving static files from:", publicPath);

    // // Verify publicPath exists
    // if (!existsSync(publicPath)) {
    //   throw new Error(`Static directory not found: ${publicPath}`);
    // }
    // if (!existsSync(path.join(publicPath, "index.html"))) {
    //   throw new Error(`index.html not found in ${publicPath}`);
    // }
    // // Verify publicPath exists
    // if (!existsSync(publicPath)) {
    //   throw new Error(`Static directory not found: ${publicPath}`);
    // }
    // if (!existsSync(path.join(publicPath, "index.html"))) {
    //   throw new Error(`index.html not found in ${publicPath}`);
    // }

    // this.fastify.register(FastifyStatic, {
    //   root: publicPath,
    //   prefix: "/",
    //   index: "index.html",
    //   wildcard: false, // Avoid interfering with API routes
    //   setHeaders: (res) => {
    //     res.setHeader("Cache-Control", "public, max-age=0");
    //   },
    // });
    // this.fastify.register(FastifyStatic, {
    //   root: publicPath,
    //   prefix: "/",
    //   index: "index.html",
    //   wildcard: false, // Avoid interfering with API routes
    //   setHeaders: (res) => {
    //     res.setHeader("Cache-Control", "public, max-age=0");
    //   },
    // });

    // // Fallback for SPA routes: Serve index.html for non-API routes
    // this.fastify.get("/*", (req, reply) => {
    //   if (!req.url.startsWith(process.env.API_PREFIX!)) {
    //     reply.sendFile("index.html", publicPath);
    //   } else {
    //     reply.status(404).send({ error: "Not Found" });
    //   }
    // });
    // // Fallback for SPA routes: Serve index.html for non-API routes
    // this.fastify.get("/*", (req, reply) => {
    //   if (!req.url.startsWith(process.env.API_PREFIX!)) {
    //     reply.sendFile("index.html", publicPath);
    //   } else {
    //     reply.status(404).send({ error: "Not Found" });
    //   }
    // });

    this.fastify.register((trpcScope) => {
      const REQS = new WeakMap<
        FastifyRequest | IncomingMessage,
        FastifyRequest
      >();

      trpcScope.addHook("onRequest", async (req) => {
        // associate each raw IncomingMessage (req.raw) with
        // the original IncomingMessage
        REQS.set(req.raw, req);
      });

      trpcScope.register(fastifyTRPCPlugin, {
        prefix: process.env.API_PREFIX,
        useWSS: true,
        keepAlive: { enabled: true, pingMs: 15000, pongWaitMs: 10000 },
        trpcOptions: {
          router: appRouter,
          createContext: ({ req, res }) => {
            const realReq = REQS.get(req.raw ?? req);
            const session = realReq?.session as CustomSession;

            return createContext({
              req: realReq as FastifyRequest,
              res,
              session,
              sessionStore,
              oidcConfig: {
                issuerURL: process.env.OIDC_ISSUER_URL!,
                clientID: process.env.OIDC_CLIENT_ID!,
                clientSecret: process.env.OIDC_CLIENT_SECRET!,
                scope: process.env.OIDC_SCOPE!,
                codeChallengeMethod: process.env.OIDC_CODE_CHALLENGE_METHOD!,
              },
            });
          },
        } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
      });
    });

    this.fastify.addHook("onClose", (instance, done) => {
      sessionStore.cleanup();
      done();
    });
  }

  async start() {
    try {
      this.registerPlugins();
      this.fastify.listen(
        {
          port: Number(process.env.SERVER_PORT),
        },
        (error, address) => {
          if (error) {
            console.error("Fastify listen error", error);
          }
          console.log(`🚀 Server running at ${address}`);
        }
      );
    } catch (err) {
      console.error("Error starting server:", err);
      process.exit(1);
    }
  }
}
