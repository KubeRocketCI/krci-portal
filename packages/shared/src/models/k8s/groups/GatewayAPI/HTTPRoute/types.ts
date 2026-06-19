import z from "zod";
import { httpRouteDraftSchema, httpRouteSchema } from "./schema.js";

export type HTTPRoute = z.infer<typeof httpRouteSchema>;
export type HTTPRouteDraft = z.infer<typeof httpRouteDraftSchema>;
