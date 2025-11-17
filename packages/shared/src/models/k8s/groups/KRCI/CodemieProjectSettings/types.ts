import z from "zod";
import {
  codemieProjectSettingsDraftSchema,
  codemieProjectSettingsSchema,
  codemieProjectSettingsStatusEnum,
} from "./schema.js";

export type CodemieProjectSettings = z.infer<typeof codemieProjectSettingsSchema>;
export type CodemieProjectSettingsDraft = z.infer<typeof codemieProjectSettingsDraftSchema>;

export type CodemieProjectSettingsStatus = z.infer<typeof codemieProjectSettingsStatusEnum>;
