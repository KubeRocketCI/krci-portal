import { DefinedUseQueryResult } from "@tanstack/react-query";
import { DefaultPermissionListCheckResult } from "@my-project/shared";

/**
 * Type for the return value of usePermissions hook
 */
export type UsePermissionsResult = DefinedUseQueryResult<DefaultPermissionListCheckResult, Error>;
