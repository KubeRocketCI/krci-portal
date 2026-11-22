// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeDefectDojoApi } from "@/modules/platform/security/prototype-defectdojo/api/context";
import { PrototypeDefectDojoProvider } from "@/modules/platform/security/prototype-defectdojo/api/provider";
import type { CodebaseFindingsScope, CodebaseFindingsVariantKey, EnvironmentFocus } from "./types";
import { VariantA } from "./variants/VariantA";
import { VariantB } from "./variants/VariantB";
import { VariantC } from "./variants/VariantC";

export interface CodebaseFindingsVariantProps {
  variant: CodebaseFindingsVariantKey;
  scope: CodebaseFindingsScope;
  /** Environment to put in focus. Default: none. */
  focus?: EnvironmentFocus | null;
  /** Default: the tRPC client. Stories pass a fixture-backed API. */
  api?: PrototypeDefectDojoApi;
}

/** One variant of the tab. Each variant has its own query cache scope and request log. */
export function CodebaseFindingsVariant({ variant, scope, focus = null, api }: CodebaseFindingsVariantProps) {
  const cacheScope = `codebase-${variant}`;

  return (
    <PrototypeDefectDojoProvider key={cacheScope} api={api} cacheScope={cacheScope}>
      {variant === "A" && <VariantA scope={scope} focus={focus} />}
      {variant === "B" && <VariantB scope={scope} focus={focus} />}
      {variant === "C" && <VariantC scope={scope} focus={focus} />}
    </PrototypeDefectDojoProvider>
  );
}
