import z from "zod";
import { templateSchema } from ".";

export type Template = z.infer<typeof templateSchema>;
