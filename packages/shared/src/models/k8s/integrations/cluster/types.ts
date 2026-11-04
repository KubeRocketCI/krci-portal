import z from "zod";

export const clusterTypeEnum = z.enum(["bearer", "irsa"]);

export const clusterType = clusterTypeEnum.enum;

export type ClusterType = z.infer<typeof clusterTypeEnum>;

export const CLUSTER_SECRET_NAME_SUFFIX = "-cluster";

export const getClusterSecretName = (clusterName: string) => `${clusterName}${CLUSTER_SECRET_NAME_SUFFIX}`;
