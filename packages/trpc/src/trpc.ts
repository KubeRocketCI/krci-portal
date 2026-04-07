import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import type { TRPCContext } from "./context/types.js";

export function formatError({ shape, error }: { shape: any; error: { cause?: unknown } }) {
  return {
    ...shape,
    data: {
      ...shape.data,
      source: (error.cause as Record<string, unknown> | undefined)?.source as string | undefined,
    },
  };
}

export const t = initTRPC.context<TRPCContext>().meta<OpenApiMeta>().create({
  errorFormatter: formatError,
});

export const router = t.router;
export const publicProcedure = t.procedure;
