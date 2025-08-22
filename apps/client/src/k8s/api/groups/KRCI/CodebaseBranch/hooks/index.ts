import {
  createUsePermissionsHook,
  createUseWatchItemHook,
  createUseWatchListHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { CodebaseBranch, k8sCodebaseBranchConfig } from "@my-project/shared";

export { useCRUD as useCodebaseBranchCRUD } from "./useCRUD";

export const useCodebaseBranchPermissions = createUsePermissionsHook(k8sCodebaseBranchConfig);
export const useCodebaseBranchWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CodebaseBranch>) =>
  createUseWatchListHook<CodebaseBranch>(k8sCodebaseBranchConfig)(params);
export const useCodebaseBranchWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CodebaseBranch>) =>
  createUseWatchItemHook<CodebaseBranch>(k8sCodebaseBranchConfig)(params);
