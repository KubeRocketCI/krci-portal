import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sExposedSecretReportConfig, ExposedSecretReport } from "@my-project/shared";

export const useExposedSecretReportPermissions = createUsePermissionsHook(k8sExposedSecretReportConfig);

export const useExposedSecretReportWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<ExposedSecretReport>
) => createUseWatchListHook<ExposedSecretReport>(k8sExposedSecretReportConfig)(params);

export const useExposedSecretReportWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ExposedSecretReport>) =>
  createUseWatchItemHook<ExposedSecretReport>(k8sExposedSecretReportConfig)(params);
