// import React from "react";
// import { useHierarchicalWatchList } from "./useHierarchicalWatchList";
// import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

// // You'll need to define these types based on your actual Codebase and CodebaseBranch types
// interface CodebaseKubeObject extends KubeObjectBase {
//   spec: {
//     type: string;
//     [key: string]: any;
//   };
// }

// interface CodebaseBranchKubeObject extends KubeObjectBase {
//   spec: {
//     branchName: string;
//     codebaseName: string;
//     [key: string]: any;
//   };
// }

// export interface AutotestWithBranchesOption {
//   name: string;
//   branches: string[];
// }

// // Resource configurations - adjust these based on your actual API group and version
// const CODEBASE_RESOURCE_CONFIG: K8sResourceConfig = {
//   group: "v2.edp.epam.com", // Adjust to your actual API group
//   version: "v1", // Adjust to your actual version
//   pluralName: "codebases",
//   singularName: "codebase",
//   namespaced: true,
// };

// const CODEBASE_BRANCH_RESOURCE_CONFIG: K8sResourceConfig = {
//   group: "v2.edp.epam.com", // Adjust to your actual API group
//   version: "v1", // Adjust to your actual version
//   pluralName: "codebasebranches",
//   singularName: "codebasebranch",
//   namespaced: true,
// };

// const CODEBASE_TYPE = {
//   AUTOTEST: "autotest",
// } as const;

// export const useAutotestsWithBranches = (
//   namespace?: string
// ): {
//   autotestsWithBranches: AutotestWithBranchesOption[];
//   isLoading: boolean;
//   isEmpty: boolean;
// } => {
//   const hierarchicalWatch = useHierarchicalWatchList<CodebaseKubeObject, CodebaseBranchKubeObject>({
//     parentConfig: {
//       resourceConfig: CODEBASE_RESOURCE_CONFIG,
//       namespace,
//       labels: {
//         type: CODEBASE_TYPE.AUTOTEST,
//       },
//     },
//     childResourceConfig: CODEBASE_BRANCH_RESOURCE_CONFIG,
//     getChildLabels: (parent: CodebaseKubeObject) => ({
//       "app.edp.epam.com/codebaseName": parent.metadata.name!, // Adjust label key as needed
//     }),
//     getChildNamespace: (parent: CodebaseKubeObject) => parent.metadata.namespace,
//   });

//   // Transform the hierarchical data into the format you need
//   const autotestsWithBranches = React.useMemo((): AutotestWithBranchesOption[] => {
//     return hierarchicalWatch.data.map(({ parent, children }) => ({
//       name: parent.metadata.name!,
//       branches: children.map((child) => child.spec.branchName),
//     }));
//   }, [hierarchicalWatch.data]);

//   return {
//     autotestsWithBranches,
//     isLoading: hierarchicalWatch.isLoading,
//     isEmpty: hierarchicalWatch.isEmpty,
//   };
// };
