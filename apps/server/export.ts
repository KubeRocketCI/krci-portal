import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "./src/trpc/routers/index";

export type { AppRouter, inferProcedureInput, inferProcedureOutput };
