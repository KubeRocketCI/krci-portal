import { k8sResourceNameSchema } from "@my-project/shared";
import { z } from "zod";

/** TanStack Router JSON.parses search values, so `?codebase=123` arrives as a number: coerce before validating. */
export const k8sNameSearchParam = z.coerce.string().pipe(k8sResourceNameSchema).optional().catch(undefined);
