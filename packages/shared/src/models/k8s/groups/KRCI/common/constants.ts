import {
  ciToolEnum,
  krciConfigMapNamesEnum,
  gitProviderEnum,
  krciStatusEnum,
  monitoringProviderEnum,
  protectedOperationsEnum,
} from "./schema.js";

export const ciTool = ciToolEnum.enum;

export const krciStatus = krciStatusEnum.enum;

export const gitProvider = gitProviderEnum.enum;

export const protectedOperations = protectedOperationsEnum.enum;

export const monitoringProvider = monitoringProviderEnum.enum;

export const krciConfigMapNames = krciConfigMapNamesEnum.enum;
