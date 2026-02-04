import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sInfraAssessmentReportConfig, InfraAssessmentReport } from "@my-project/shared";

export const useInfraAssessmentReportPermissions = createUsePermissionsHook(k8sInfraAssessmentReportConfig);

export const useInfraAssessmentReportWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<InfraAssessmentReport>
) => createUseWatchListHook<InfraAssessmentReport>(k8sInfraAssessmentReportConfig)(params);

export const useInfraAssessmentReportWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<InfraAssessmentReport>
) => createUseWatchItemHook<InfraAssessmentReport>(k8sInfraAssessmentReportConfig)(params);
