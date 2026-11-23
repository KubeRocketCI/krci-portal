import { stripTrailingSlash } from "@my-project/shared";
import type { DefectDojoClientConfig } from "./types.js";

export type DefectDojoEnvConfig = Pick<DefectDojoClientConfig, "apiBaseURL" | "token" | "webBaseURL" | "productType">;

/**
 * The DefectDojo settings of the environment when `DEFECTDOJO_URL` and `DEFECTDOJO_TOKEN` are both set, `null`
 * otherwise. Values are trimmed and a setting that is not set stays `undefined`: the client applies the defaults.
 */
export function loadDefectDojoConfig(env: NodeJS.ProcessEnv): DefectDojoEnvConfig | null {
  const apiBaseURL = stripTrailingSlash(env.DEFECTDOJO_URL?.trim());
  const token = env.DEFECTDOJO_TOKEN?.trim() ?? "";

  if (!apiBaseURL || !token) {
    return null;
  }

  return {
    apiBaseURL,
    token,
    webBaseURL: stripTrailingSlash(env.DEFECTDOJO_WEB_URL?.trim()) || undefined,
    productType: env.DEFECTDOJO_PRODUCT_TYPE?.trim() || undefined,
  };
}

export function isDefectDojoConfigured(env: NodeJS.ProcessEnv): boolean {
  return loadDefectDojoConfig(env) !== null;
}
