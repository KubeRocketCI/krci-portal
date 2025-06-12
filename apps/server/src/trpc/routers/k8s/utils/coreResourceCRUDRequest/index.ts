import * as k8s from "@kubernetes/client-node";
import { CrudType, KubeObjectDraft } from "@my-project/shared";
import { TRPCError } from "@trpc/server";

// TODO: Refactor this function to use a more generic approach for CRUD operations

export const coreResourceCRUDRequest = ({
  client,
  resourcePlural,
  crudType,
  props,
}: {
  client: k8s.CoreV1Api;
  resourcePlural: string;
  crudType: CrudType;
  props: {
    namespace: string;
    resource?: KubeObjectDraft;
    name?: string;
  };
}) => {
  switch (resourcePlural) {
    case "secrets":
      switch (crudType) {
        case "create":
          return client.createNamespacedSecret({
            namespace: props.namespace,
            body: props.resource!,
          });
        case "update":
          return client.patchNamespacedSecret({
            namespace: props.namespace,
            body: props.resource,
            name: props.resource!.metadata.name,
          });
        case "delete":
          return client.deleteNamespacedSecret({
            namespace: props.namespace,
            name: props.name!,
          });
        default:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unsupported CRUD operation for Secret: " + crudType,
          });
      }
    case "configmaps":
      switch (crudType) {
        case "create":
          return client.createNamespacedConfigMap({
            namespace: props.namespace,
            body: props.resource!,
          });
        case "update":
          return client.patchNamespacedConfigMap({
            namespace: props.namespace,
            body: props.resource,
            name: props.resource!.metadata.name,
          });
        case "delete":
          return client.deleteNamespacedConfigMap({
            namespace: props.namespace,
            name: props.name!,
          });
        default:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unsupported CRUD operation for ConfigMap: " + crudType,
          });
      }
  }
};
