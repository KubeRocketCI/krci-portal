import z from "zod";
import { persistentVolumeDraftSchema, persistentVolumeSchema } from "./schema.js";

export type PersistentVolume = z.infer<typeof persistentVolumeSchema>;
export type PersistentVolumeDraft = z.infer<typeof persistentVolumeDraftSchema>;
