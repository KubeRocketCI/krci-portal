import { LEVEL_META } from "@/modules/platform/security/components/defectdojo/constants";

/** The Code and Image levels come from one part, the CI scans of the tenant. */
export const CODEBASES_PART = {
  what: "Code and Image findings",
  producer: LEVEL_META.code.producer,
  subject: "the codebases of this installation",
} as const;

export const RUNTIME_PART = {
  what: LEVEL_META.runtime.findings,
  producer: LEVEL_META.runtime.producer,
  subject: "this installation",
} as const;

export const TOP_NAMESPACES_TITLE = "Namespaces with the most findings";

export const TOP_CODEBASES_TITLE = "Codebases with the most findings";
