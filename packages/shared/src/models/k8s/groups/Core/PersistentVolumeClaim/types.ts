import z from "zod";
import { persistentVolumeClaimDraftSchema, persistentVolumeClaimSchema } from "./schema.js";

export type PersistentVolumeClaim = z.infer<typeof persistentVolumeClaimSchema>;
export type PersistentVolumeClaimDraft = z.infer<typeof persistentVolumeClaimDraftSchema>;
