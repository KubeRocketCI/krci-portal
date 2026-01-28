import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClusterComplianceReportConfig, ClusterComplianceReport } from "@my-project/shared";

export const useClusterComplianceReportPermissions = createUsePermissionsHook(k8sClusterComplianceReportConfig);

export const useClusterComplianceReportWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<ClusterComplianceReport>
) => createUseWatchListHook<ClusterComplianceReport>(k8sClusterComplianceReportConfig)(params);

export const useClusterComplianceReportWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<ClusterComplianceReport>
) => createUseWatchItemHook<ClusterComplianceReport>(k8sClusterComplianceReportConfig)(params);
