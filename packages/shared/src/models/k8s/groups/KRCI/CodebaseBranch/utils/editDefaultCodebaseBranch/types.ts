import { editDefaultCodebaseBranchInputSchema } from "./schema.js";
import z from "zod";

export type EditDefaultCodebaseBranchInput = z.infer<typeof editDefaultCodebaseBranchInputSchema>;
