import { t } from "../..";
import { k8sGetApiVersions } from "./procedures/apiVersions";
import { k8sCreateItemProcedure } from "./procedures/create";
import { k8sDeleteItemProcedure } from "./procedures/delete";
import { k8sGetProcedure } from "./procedures/get";
import { k8sGetKubeConfig } from "./procedures/kubeconfig";
import { k8sListProcedure } from "./procedures/list";
import { k8sGetResourcePermissions } from "./procedures/permissions";
import { k8sUpdateItemProcedure } from "./procedures/update";
import { k8sWatchItemProcedure } from "./procedures/watchItem";
import { k8sWatchListProcedure } from "./procedures/watchList";

export const k8sRouter = t.router({
  get: k8sGetProcedure,
  watchItem: k8sWatchItemProcedure,
  list: k8sListProcedure,
  watchList: k8sWatchListProcedure,
  create: k8sCreateItemProcedure,
  update: k8sUpdateItemProcedure,
  delete: k8sDeleteItemProcedure,
  apiVersions: k8sGetApiVersions,
  itemPermissions: k8sGetResourcePermissions,
  kubeconfig: k8sGetKubeConfig,
});
