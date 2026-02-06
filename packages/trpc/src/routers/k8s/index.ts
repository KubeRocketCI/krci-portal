import { k8sGetApiVersions } from "./procedures/basic/apiVersions/index.js";
import { k8sCreateItemProcedure } from "./procedures/basic/create/index.js";
import { k8sDeleteItemProcedure } from "./procedures/basic/delete/index.js";
import { k8sGetProcedure } from "./procedures/basic/get/index.js";
import { k8sGetKubeConfig } from "./procedures/kubeconfig/index.js";
import { k8sListProcedure } from "./procedures/basic/list/index.js";
import { k8sGetResourcePermissions } from "./procedures/permissions/index.js";
import { k8sPatchItemProcedure } from "./procedures/basic/patch/index.js";
import { k8sWatchItemProcedure } from "./procedures/basic/watchItem/index.js";
import { k8sWatchListProcedure } from "./procedures/basic/watchList/index.js";
import { k8sPodLogsProcedure, k8sWatchPodLogsProcedure } from "./procedures/basic/logs/index.js";
import { k8sPodExecProcedure, k8sPodAttachProcedure } from "./procedures/basic/exec/index.js";
import { k8sGetClusterDetails } from "./procedures/clusterDetails/index.js";
import { k8sManageArgoCDIntegrationProcedure } from "./procedures/composite/manageArgoCDIntegration/index.js";
import { k8sManageRegistryIntegrationProcedure } from "./procedures/composite/manageRegistryIntegration/index.js";
import { k8sManageGitServerIntegrationProcedure } from "./procedures/composite/manageGitServerIntegration/index.js";
import { k8sManageJiraIntegrationProcedure } from "./procedures/composite/manageJiraIntegration/index.js";
import { k8sManageSonarIntegrationProcedure } from "./procedures/composite/manageSonarIntegration/index.js";
import { k8sManageNexusIntegrationProcedure } from "./procedures/composite/manageNexusIntegration/index.js";
import { k8sManageDefectDojoIntegrationProcedure } from "./procedures/composite/manageDefectDojoIntegration/index.js";
import { k8sManageChatAssistantIntegrationProcedure } from "./procedures/composite/manageChatAssistantIntegration/index.js";
import { k8sManageDependencyTrackIntegrationProcedure } from "./procedures/composite/manageDependencyTrackIntegration/index.js";
import { k8sTestIntegrationConnectionProcedure } from "./procedures/composite/testIntegrationConnection/index.js";
import { t } from "../../trpc.js";

export const k8sRouter = t.router({
  get: k8sGetProcedure,
  list: k8sListProcedure,
  watchItem: k8sWatchItemProcedure,
  watchList: k8sWatchListProcedure,
  create: k8sCreateItemProcedure,
  patch: k8sPatchItemProcedure,
  delete: k8sDeleteItemProcedure,
  apiVersions: k8sGetApiVersions,
  itemPermissions: k8sGetResourcePermissions,
  kubeconfig: k8sGetKubeConfig,
  clusterDetails: k8sGetClusterDetails,
  podLogs: k8sPodLogsProcedure,
  watchPodLogs: k8sWatchPodLogsProcedure,
  podExec: k8sPodExecProcedure,
  podAttach: k8sPodAttachProcedure,
  // Composite operations
  manageArgoCDIntegration: k8sManageArgoCDIntegrationProcedure,
  manageRegistryIntegration: k8sManageRegistryIntegrationProcedure,
  manageGitServerIntegration: k8sManageGitServerIntegrationProcedure,
  manageJiraIntegration: k8sManageJiraIntegrationProcedure,
  manageSonarIntegration: k8sManageSonarIntegrationProcedure,
  manageNexusIntegration: k8sManageNexusIntegrationProcedure,
  manageDefectDojoIntegration: k8sManageDefectDojoIntegrationProcedure,
  manageChatAssistantIntegration: k8sManageChatAssistantIntegrationProcedure,
  manageDependencyTrackIntegration: k8sManageDependencyTrackIntegrationProcedure,
  testIntegrationConnection: k8sTestIntegrationConnectionProcedure,
});
