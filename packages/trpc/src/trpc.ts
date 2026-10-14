import { initTRPC, type TRPCDefaultErrorShape } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import { findHttpError, HttpStatusError } from "./clients/http/index.js";
import type { TRPCContext } from "./context/types.js";

// Registers `.openapi()` on zod schemas. Every procedure module imports this
// module first, before building its input schema.
extendZodWithOpenApi(z);

export function formatError({ shape, error }: { shape: TRPCDefaultErrorShape; error: { cause?: unknown } }) {
  const httpError = findHttpError(error.cause);

  return {
    ...shape,
    data: {
      ...shape.data,
      source: (error.cause as Record<string, unknown> | undefined)?.source as string | undefined,
      requestId: httpError instanceof HttpStatusError ? httpError.requestId : undefined,
    },
  };
}

export const t = initTRPC.context<TRPCContext>().meta<OpenApiMeta>().create({
  errorFormatter: formatError,
});

export const router = t.router;
export const publicProcedure = t.procedure;
