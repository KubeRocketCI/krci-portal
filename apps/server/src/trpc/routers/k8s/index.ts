import { t } from "../..";
import { k8sGetApiVersions } from "./procedures/basic/apiVersions";
import { k8sCreateItemProcedure } from "./procedures/basic/create";
import { k8sDeleteItemProcedure } from "./procedures/basic/delete";
import { k8sGetProcedure } from "./procedures/basic/get";
import { k8sGetKubeConfig } from "./procedures/kubeconfig";
import { k8sListProcedure } from "./procedures/basic/list";
import { k8sGetResourcePermissions } from "./procedures/permissions";
import { k8sPatchItemProcedure } from "./procedures/basic/patch";
import { k8sWatchItemProcedure } from "./procedures/basic/watchItem";
import { k8sWatchListProcedure } from "./procedures/basic/watchList";
import {
  k8sPodLogsProcedure,
  k8sWatchPodLogsProcedure,
} from "./procedures/basic/logs";
import {
  k8sPodExecProcedure,
  k8sPodAttachProcedure,
} from "./procedures/basic/exec";

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
  podLogs: k8sPodLogsProcedure,
  watchPodLogs: k8sWatchPodLogsProcedure,
  podExec: k8sPodExecProcedure,
  podAttach: k8sPodAttachProcedure,
});
