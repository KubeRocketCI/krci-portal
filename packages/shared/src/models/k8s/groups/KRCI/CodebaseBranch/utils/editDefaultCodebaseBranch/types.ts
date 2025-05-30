import { editDefaultCodebaseBranchInputSchema } from "./schema";
import z from "zod";

export type EditDefaultCodebaseBranchInput = z.infer<
  typeof editDefaultCodebaseBranchInputSchema
>;
