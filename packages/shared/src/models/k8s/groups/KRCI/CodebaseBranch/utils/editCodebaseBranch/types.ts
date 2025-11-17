import { editCodebaseBranchInputSchema } from "./schema.js";
import z from "zod";

export type EditCodebaseBranchInput = z.infer<typeof editCodebaseBranchInputSchema>;
