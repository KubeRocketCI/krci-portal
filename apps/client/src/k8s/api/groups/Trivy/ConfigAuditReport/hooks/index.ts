import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sConfigAuditReportConfig, ConfigAuditReport } from "@my-project/shared";

export const useConfigAuditReportPermissions = createUsePermissionsHook(k8sConfigAuditReportConfig);

export const useConfigAuditReportWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ConfigAuditReport>) =>
  createUseWatchListHook<ConfigAuditReport>(k8sConfigAuditReportConfig)(params);

export const useConfigAuditReportWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ConfigAuditReport>) =>
  createUseWatchItemHook<ConfigAuditReport>(k8sConfigAuditReportConfig)(params);
