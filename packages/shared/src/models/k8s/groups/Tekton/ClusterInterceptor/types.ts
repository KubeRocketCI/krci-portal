import z from "zod";
import { clusterInterceptorSchema } from "./schema.js";

export type ClusterInterceptor = z.infer<typeof clusterInterceptorSchema>;
