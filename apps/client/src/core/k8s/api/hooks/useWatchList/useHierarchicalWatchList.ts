// import { trpc } from "@/core/clients/trpc";
// import { useClusterStore } from "@/core/store";
// import { K8sResourceConfig, KubeObjectBase, ResourceLabels } from "@my-project/shared";
// import { useQueryClient } from "@tanstack/react-query";
// import React from "react";
// import { useShallow } from "zustand/react/shallow";
// import { K8S_DEFAULT_CLUSTER_NAME } from "../../../constants";
// import { RequestError } from "@/core/types/global";
// import { useWatchList, UseWatchListParams } from "./index";

// export interface HierarchicalItem<Parent extends KubeObjectBase, Child extends KubeObjectBase> {
//   parent: Parent;
//   children: Child[];
// }

// export interface UseHierarchicalWatchListParams<Parent extends KubeObjectBase> {
//   parentConfig: UseWatchListParams<Parent>;
//   childResourceConfig: K8sResourceConfig;
//   getChildLabels?: (parent: Parent) => ResourceLabels | undefined;
//   getChildNamespace?: (parent: Parent) => string | undefined;
//   enabled?: boolean;
// }

// export interface UseHierarchicalWatchListResult<Parent extends KubeObjectBase, Child extends KubeObjectBase> {
//   data: HierarchicalItem<Parent, Child>[];
//   isLoading: boolean;
//   isEmpty: boolean;
//   parentQuery: ReturnType<typeof useWatchList<Parent>>["query"];
// }

// export const useHierarchicalWatchList = <Parent extends KubeObjectBase, Child extends KubeObjectBase>({
//   parentConfig,
//   childResourceConfig,
//   getChildLabels,
//   getChildNamespace,
//   enabled = true,
// }: UseHierarchicalWatchListParams<Parent, Child>): UseHierarchicalWatchListResult<Parent, Child> => {
//   const clusterName = K8S_DEFAULT_CLUSTER_NAME;
//   const storedNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

//   // Watch the parent resources
//   const parentWatch = useWatchList(parentConfig);

//   // Store child subscriptions and their data
//   const childSubscriptionsRef = React.useRef<Map<string, ReturnType<typeof trpc.k8s.watchList.subscribe>>>(new Map());
//   const [childrenData, setChildrenData] = React.useState<Map<string, Child[]>>(new Map());

//   // Track parent resource versions for child subscriptions
//   const childResourceVersionsRef = React.useRef<Map<string, string>>(new Map());

//   React.useEffect(() => {
//     if (!enabled || !parentWatch.query.isFetched) {
//       return;
//     }

//     const currentParents = new Set<string>();
//     const newChildrenData = new Map(childrenData);

//     // Process each parent resource
//     parentWatch.dataArray.forEach((parent) => {
//       const parentName = parent.metadata.name!;
//       currentParents.add(parentName);

//       // Skip if we already have a subscription for this parent
//       if (childSubscriptionsRef.current.has(parentName)) {
//         return;
//       }

//       // Create child subscription for this parent
//       const childLabels = getChildLabels?.(parent);
//       const childNamespace = getChildNamespace?.(parent) ?? storedNamespace;

//       // First, get initial data
//       trpc.k8s.list
//         .query({
//           clusterName,
//           resourceConfig: childResourceConfig,
//           namespace: childNamespace,
//           labels: childLabels,
//         })
//         .then((initialData) => {
//           // Set initial children data
//           setChildrenData((prev) => new Map(prev.set(parentName, initialData.items as Child[])));

//           // Store resource version for watching
//           const resourceVersion = initialData.metadata?.resourceVersion;
//           if (resourceVersion) {
//             childResourceVersionsRef.current.set(parentName, resourceVersion);

//             // Create subscription for real-time updates
//             const subscription = trpc.k8s.watchList.subscribe(
//               {
//                 clusterName,
//                 resourceConfig: childResourceConfig,
//                 namespace: childNamespace,
//                 labels: childLabels,
//                 resourceVersion,
//               },
//               {
//                 onData: (value: { type: string; data?: KubeObjectBase }) => {
//                   if (!value.data?.metadata?.name) return;

//                   setChildrenData((prevData) => {
//                     const newData = new Map(prevData);
//                     const currentChildren = newData.get(parentName) || [];
//                     const childName = value.data!.metadata.name!;

//                     let updatedChildren: Child[];

//                     switch (value.type) {
//                       case "ADDED":
//                         updatedChildren = [...currentChildren, value.data as Child];
//                         break;
//                       case "MODIFIED":
//                         updatedChildren = currentChildren.map((child) =>
//                           child.metadata.name === childName ? (value.data as Child) : child
//                         );
//                         break;
//                       case "DELETED":
//                         updatedChildren = currentChildren.filter((child) => child.metadata.name !== childName);
//                         break;
//                       default:
//                         updatedChildren = currentChildren;
//                     }

//                     newData.set(parentName, updatedChildren);
//                     return newData;
//                   });

//                   // Update resource version
//                   if (value.data?.metadata?.resourceVersion) {
//                     childResourceVersionsRef.current.set(parentName, value.data.metadata.resourceVersion);
//                   }
//                 },
//                 onError: (error: RequestError) => {
//                   console.error(`WebSocket error for child resources of ${parentName}:`, error);
//                 },
//               }
//             );

//             childSubscriptionsRef.current.set(parentName, subscription);
//           }
//         })
//         .catch((error) => {
//           console.error(`Failed to fetch initial child data for ${parentName}:`, error);
//         });
//     });

//     // Clean up subscriptions for parents that no longer exist
//     childSubscriptionsRef.current.forEach((subscription, parentName) => {
//       if (!currentParents.has(parentName)) {
//         subscription.unsubscribe();
//         childSubscriptionsRef.current.delete(parentName);
//         childResourceVersionsRef.current.delete(parentName);
//         newChildrenData.delete(parentName);
//       }
//     });

//     if (newChildrenData.size !== childrenData.size) {
//       setChildrenData(newChildrenData);
//     }
//   }, [
//     enabled,
//     parentWatch.query.isFetched,
//     parentWatch.dataArray,
//     childResourceConfig,
//     clusterName,
//     storedNamespace,
//     getChildLabels,
//     getChildNamespace,
//     childrenData,
//   ]);

//   // Cleanup on unmount
//   React.useEffect(() => {
//     return () => {
//       childSubscriptionsRef.current.forEach((subscription) => {
//         subscription.unsubscribe();
//       });
//       childSubscriptionsRef.current.clear();
//       childResourceVersionsRef.current.clear();
//     };
//   }, []);

//   // Combine parent and children data
//   const combinedData = React.useMemo((): HierarchicalItem<Parent, Child>[] => {
//     return parentWatch.dataArray.map((parent) => ({
//       parent,
//       children: childrenData.get(parent.metadata.name!) || [],
//     }));
//   }, [parentWatch.dataArray, childrenData]);

//   return {
//     data: combinedData,
//     isLoading: parentWatch.query.isLoading,
//     isEmpty: combinedData.length === 0,
//     parentQuery: parentWatch.query,
//   };
// };
