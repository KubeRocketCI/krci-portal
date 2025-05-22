import { APPLICATION_MAPPING } from "@/core/k8s/configs/codebase-mappings/application";
import { AUTOTEST_MAPPING } from "@/core/k8s/configs/codebase-mappings/autotest";
import { INFRASTRUCTURE_MAPPING } from "@/core/k8s/configs/codebase-mappings/infrastructure";
import { LIBRARY_MAPPING } from "@/core/k8s/configs/codebase-mappings/library";
import { SYSTEM_MAPPING } from "@/core/k8s/configs/codebase-mappings/system";
import { CodebaseType, CODEBASE_TYPE } from "@/core/k8s/constants/codebaseTypes";

export const getCodebaseMappingByType = (type: CodebaseType | string) => {
  return type === CODEBASE_TYPE.APPLICATION
    ? APPLICATION_MAPPING
    : type === CODEBASE_TYPE.LIBRARY
      ? LIBRARY_MAPPING
      : type === CODEBASE_TYPE.AUTOTEST
        ? AUTOTEST_MAPPING
        : type === CODEBASE_TYPE.INFRASTRUCTURE
          ? INFRASTRUCTURE_MAPPING
          : type === CODEBASE_TYPE.SYSTEM
            ? SYSTEM_MAPPING
            : null;
};
