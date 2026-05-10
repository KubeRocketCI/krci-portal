import z from "zod";
import { storageClassDraftSchema, storageClassSchema } from "./schema.js";

export type StorageClass = z.infer<typeof storageClassSchema>;
export type StorageClassDraft = z.infer<typeof storageClassDraftSchema>;
