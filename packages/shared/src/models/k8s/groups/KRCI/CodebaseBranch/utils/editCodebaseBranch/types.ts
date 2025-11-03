import { editCodebaseBranchInputSchema } from "./schema";
import z from "zod";

export type EditCodebaseBranchInput = z.infer<typeof editCodebaseBranchInputSchema>;
