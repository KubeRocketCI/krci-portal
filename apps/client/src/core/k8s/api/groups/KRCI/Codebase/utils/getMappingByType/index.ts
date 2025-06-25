import { codebaseType, CodebaseType } from "@my-project/shared";
import { APPLICATION_MAPPING, ApplicationMapping } from "../../configs/mappings/application";
import { AUTOTEST_MAPPING, AutotestMapping } from "../../configs/mappings/autotest";
import { INFRASTRUCTURE_MAPPING, InfrastructureMapping } from "../../configs/mappings/infrastructure";
import { LIBRARY_MAPPING, LibraryMapping } from "../../configs/mappings/library";
import { SYSTEM_MAPPING, SystemMapping } from "../../configs/mappings/system";

export const getMappingByType = (
  type: CodebaseType | string
): ApplicationMapping | LibraryMapping | AutotestMapping | InfrastructureMapping | SystemMapping | null => {
  return type === codebaseType.application
    ? APPLICATION_MAPPING
    : type === codebaseType.library
      ? LIBRARY_MAPPING
      : type === codebaseType.autotest
        ? AUTOTEST_MAPPING
        : type === codebaseType.infrastructure
          ? INFRASTRUCTURE_MAPPING
          : type === codebaseType.system
            ? SYSTEM_MAPPING
            : null;
};
