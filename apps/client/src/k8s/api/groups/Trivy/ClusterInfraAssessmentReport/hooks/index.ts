import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClusterInfraAssessmentReportConfig, ClusterInfraAssessmentReport } from "@my-project/shared";

export const useClusterInfraAssessmentReportPermissions = createUsePermissionsHook(
  k8sClusterInfraAssessmentReportConfig
);

export const useClusterInfraAssessmentReportWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<ClusterInfraAssessmentReport>
) => createUseWatchListHook<ClusterInfraAssessmentReport>(k8sClusterInfraAssessmentReportConfig)(params);

export const useClusterInfraAssessmentReportWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<ClusterInfraAssessmentReport>
) => createUseWatchItemHook<ClusterInfraAssessmentReport>(k8sClusterInfraAssessmentReportConfig)(params);
