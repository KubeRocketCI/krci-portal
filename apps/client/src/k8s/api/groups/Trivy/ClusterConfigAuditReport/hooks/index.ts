import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClusterConfigAuditReportConfig, ClusterConfigAuditReport } from "@my-project/shared";

export const useClusterConfigAuditReportPermissions = createUsePermissionsHook(k8sClusterConfigAuditReportConfig);

export const useClusterConfigAuditReportWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<ClusterConfigAuditReport>
) => createUseWatchListHook<ClusterConfigAuditReport>(k8sClusterConfigAuditReportConfig)(params);

export const useClusterConfigAuditReportWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<ClusterConfigAuditReport>
) => createUseWatchItemHook<ClusterConfigAuditReport>(k8sClusterConfigAuditReportConfig)(params);
