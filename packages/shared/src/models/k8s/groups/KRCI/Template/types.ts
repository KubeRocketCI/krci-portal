import z from "zod";
import { templateSchema } from "./index.js";

export type Template = z.infer<typeof templateSchema>;
