import {
  CODEBASE_COMMON_BUILD_TOOLS,
  CODEBASE_COMMON_FRAMEWORKS,
  CODEBASE_COMMON_LANGUAGES,
} from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { Application, Codebase, getDeployedVersion } from "@my-project/shared";

/**
 * Version currently deployed for one application, read from the live ArgoCD `Application` (not from
 * form defaults, which can be stale for apps whose Application watch resolves after mount).
 * Centralizes the `isHelm` / `withValuesOverride` derivation shared by several call sites.
 */
export const getAppDeployedVersion = (
  appCodebase: Pick<Codebase, "spec">,
  application: Application | undefined
): string => {
  const { lang, framework, buildTool } = appCodebase.spec;

  const isHelm =
    lang === CODEBASE_COMMON_LANGUAGES.HELM &&
    framework === CODEBASE_COMMON_FRAMEWORKS.HELM &&
    buildTool === CODEBASE_COMMON_BUILD_TOOLS.HELM;

  // `application.spec` can be absent on a just-created Application, so guard before Object.hasOwn.
  const withValuesOverride = application?.spec ? Object.hasOwn(application.spec, "sources") : false;

  return getDeployedVersion(withValuesOverride, isHelm, application);
};
