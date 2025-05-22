import { ValueOf } from "@/core/types/global";

export const CODEBASE_VERSIONING_TYPE = {
  DEFAULT: "default",
  EDP: "edp",
  SEMVER: "semver",
} as const;

export type CodebaseVersioningType = ValueOf<typeof CODEBASE_VERSIONING_TYPE>;
