import z from "zod";
import { customRunSchema } from "./schema";

export type CustomRun = z.infer<typeof customRunSchema>;
