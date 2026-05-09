import z from "zod";
import { interceptorSchema } from "./schema.js";

export type Interceptor = z.infer<typeof interceptorSchema>;
