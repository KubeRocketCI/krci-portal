import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClusterRbacAssessmentReportConfig, ClusterRbacAssessmentReport } from "@my-project/shared";

export const useClusterRbacAssessmentReportPermissions = createUsePermissionsHook(k8sClusterRbacAssessmentReportConfig);

export const useClusterRbacAssessmentReportWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<ClusterRbacAssessmentReport>
) => createUseWatchListHook<ClusterRbacAssessmentReport>(k8sClusterRbacAssessmentReportConfig)(params);

export const useClusterRbacAssessmentReportWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<ClusterRbacAssessmentReport>
) => createUseWatchItemHook<ClusterRbacAssessmentReport>(k8sClusterRbacAssessmentReportConfig)(params);
