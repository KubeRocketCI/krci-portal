import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sRbacAssessmentReportConfig, RbacAssessmentReport } from "@my-project/shared";

export const useRbacAssessmentReportPermissions = createUsePermissionsHook(k8sRbacAssessmentReportConfig);

export const useRbacAssessmentReportWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<RbacAssessmentReport>
) => createUseWatchListHook<RbacAssessmentReport>(k8sRbacAssessmentReportConfig)(params);

export const useRbacAssessmentReportWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<RbacAssessmentReport>
) => createUseWatchItemHook<RbacAssessmentReport>(k8sRbacAssessmentReportConfig)(params);
