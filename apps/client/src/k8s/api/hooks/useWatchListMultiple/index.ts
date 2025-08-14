// import { KubeObjectBase, KubeObjectListBase } from "@my-project/shared";
// import { DefinedUseQueryResult, useQueries, useQueryClient } from "@tanstack/react-query";
// import React from "react";
// import { K8S_DEFAULT_CLUSTER_NAME } from "../../constants";
// import { getK8sWatchListQueryCacheKey } from "../../query-keys";
// import { useShallow } from "zustand/react/shallow";
// import { trpc } from "@/core/clients/trpc";
// import { useClusterStore } from "@/k8s/store";
// import { MSG_TYPE, MsgType, CustomKubeObjectList, k8sListInitialData } from "./useWatchList";

// type StreamEvent<T extends KubeObjectBase> = {
//   type: MsgType;
//   data: T;
// };

// export const useWatchListMultiple = <I extends KubeObjectBase>({
//   group,
//   version,
//   resourcePlural,
//   namespaces,
// }: {
//   group: string;
//   version: string;
//   resourcePlural: string;
//   namespaces: string[];
// }) => {
//   const clusterName = K8S_DEFAULT_CLUSTER_NAME;
//   const queryClient = useQueryClient();
//   const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

//   // Use default namespace if namespaces array is empty
//   const effectiveNamespaces = namespaces.length > 0 ? namespaces : [defaultNamespace];

//   // Generate query keys for each namespace
//   const queryKeys = React.useMemo(
//     () => effectiveNamespaces.map((namespace) => getK8sWatchListQueryCacheKey(clusterName, namespace, resourcePlural)),
//     [clusterName, resourcePlural, effectiveNamespaces]
//   );

//   // Track resource versions and subscriptions per namespace
//   const latestResourceVersions = React.useRef<Map<string, string | null>>(
//     new Map(effectiveNamespaces.map((ns) => [ns, null]))
//   );
//   const subscriptionsRef = React.useRef<Map<string, ReturnType<typeof trpc.k8s.watchList.subscribe>>>(new Map());

//   // Use useQueries to fetch data for each namespace
//   const queries = useQueries({
//     queries: effectiveNamespaces.map((namespace, index) => ({
//       queryKey: queryKeys[index],
//       queryFn: async () => {
//         const data: KubeObjectListBase<I> = await trpc.k8s.list.query({
//           clusterName,
//           group,
//           version,
//           namespace,
//           resourcePlural,
//         });

//         if (!latestResourceVersions.current.get(namespace) || latestResourceVersions.current.get(namespace) === "0") {
//           latestResourceVersions.current.set(namespace, data.metadata?.resourceVersion ?? "0");
//         }

//         const resources = data.items.map((item): [string, I] => {
//           // Use namespace:name as the key to ensure uniqueness across namespaces
//           return [`${namespace}:${item.metadata.name!}`, item as I];
//         });

//         return {
//           apiVersion: data.apiVersion,
//           kind: data.kind,
//           metadata: data.metadata,
//           items: new Map(resources),
//         };
//       },
//       placeholderData: k8sListInitialData as CustomKubeObjectList<I>,
//       refetchOnWindowFocus: false,
//     })),
//   });

//   // Set up subscriptions for each namespace
//   React.useEffect(() => {
//     const allFetched = queries.every((query) => query.isFetched);

//     if (!allFetched) {
//       return;
//     }

//     effectiveNamespaces.forEach((namespace, index) => {
//       const queryKey = queryKeys[index];
//       const resourceVersion = latestResourceVersions.current.get(namespace);

//       if (!resourceVersion || subscriptionsRef.current.has(namespace)) {
//         return;
//       }

//       const subscription = trpc.k8s.watchList.subscribe(
//         {
//           clusterName,
//           group,
//           version,
//           namespace,
//           resourcePlural,
//           resourceVersion,
//         },
//         {
//           onData: (value: { type: string; data?: KubeObjectBase }) => {
//             const event = value as StreamEvent<I>;
//             if (!event.data?.metadata?.name) return;

//             queryClient.setQueryData<CustomKubeObjectList<I>>(queryKey, (prevData) => {
//               if (!prevData) return prevData;

//               const newItems = new Map(prevData.items);
//               const messageKubeObject = event.data;
//               const key = `${namespace}:${messageKubeObject.metadata.name}`;

//               switch (value.type) {
//                 case MSG_TYPE.ADDED:
//                   newItems.set(key, messageKubeObject);
//                   break;
//                 case MSG_TYPE.MODIFIED: {
//                   const existing = newItems.get(key);
//                   if (existing && existing.metadata?.resourceVersion) {
//                     const currentVersion = parseInt(existing.metadata.resourceVersion, 10);
//                     const newVersion = parseInt(messageKubeObject.metadata.resourceVersion ?? "0", 10);
//                     if (currentVersion < newVersion) {
//                       newItems.set(key, messageKubeObject);
//                     }
//                   } else {
//                     newItems.set(key, messageKubeObject);
//                   }
//                   break;
//                 }
//                 case MSG_TYPE.DELETED:
//                   newItems.delete(key);
//                   break;
//                 case MSG_TYPE.ERROR:
//                   console.error("Error in update for namespace", namespace, ":", event);
//                   break;
//                 default:
//                   console.error("Unknown update type for namespace", namespace, ":", event.type);
//               }

//               // Update resource version for the namespace
//               if (messageKubeObject.metadata.resourceVersion) {
//                 latestResourceVersions.current.set(namespace, messageKubeObject.metadata.resourceVersion);
//               }

//               return {
//                 ...prevData,
//                 items: newItems,
//               };
//             });
//           },
//           onError: (error: Error) => console.error(`WebSocket error for namespace ${namespace}:`, error),
//         }
//       );

//       subscriptionsRef.current.set(namespace, subscription);
//     });

//     return () => {
//       console.log("Unsubscribing WebSockets due to useEffect cleanup");
//       subscriptionsRef.current.forEach((subscription, namespace) => {
//         subscription.unsubscribe();
//         subscriptionsRef.current.delete(namespace);
//       });
//     };
//   }, [queries, queryClient, clusterName, resourcePlural, group, version, queryKeys, effectiveNamespaces]);

//   // Combine results from all queries into a single CustomKubeObjectList
//   const combinedData = React.useMemo(() => {
//     const combinedItems = new Map<string, I>();
//     let apiVersion = "";
//     let kind = "";
//     const metadata = {} as CustomKubeObjectList<I>["metadata"];

//     queries.forEach((query, index) => {
//       const namespace = effectiveNamespaces[index];
//       const data = query.data || k8sListInitialData;

//       data.items.forEach((item, key) => {
//         // Ensure keys are unique by using namespace:name
//         combinedItems.set(`${namespace}:${key.split(":").pop()}`, item);
//       });

//       if (data.apiVersion && !apiVersion) {
//         apiVersion = data.apiVersion;
//       }
//       if (data.kind && !kind) {
//         kind = data.kind;
//       }
//     });

//     return {
//       apiVersion,
//       kind,
//       metadata,
//       items: combinedItems,
//     } as CustomKubeObjectList<I>;
//   }, [queries, effectiveNamespaces]);

//   // Determine overall query status
//   const isLoading = queries.some((query) => query.isLoading);
//   const isError = queries.some((query) => query.isError);
//   const error = queries.find((query) => query.error)?.error || null;
//   const isFetched = queries.every((query) => query.isFetched);

//   return {
//     data: combinedData,
//     isLoading,
//     isError,
//     error,
//     isFetched,
//   } as DefinedUseQueryResult<CustomKubeObjectList<I>, Error>;
// };
