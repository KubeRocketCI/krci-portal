import {
  ciToolEnum,
  krciConfigMapNamesEnum,
  gitProviderEnum,
  monitoringProviderEnum,
  protectedOperationsEnum,
} from "./schema.js";

export const ciTool = ciToolEnum.enum;

export const gitProvider = gitProviderEnum.enum;

export const protectedOperations = protectedOperationsEnum.enum;

export const monitoringProvider = monitoringProviderEnum.enum;

export const krciConfigMapNames = krciConfigMapNamesEnum.enum;
