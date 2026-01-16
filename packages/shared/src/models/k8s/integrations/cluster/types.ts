import z from "zod";

export const clusterTypeEnum = z.enum(["bearer", "irsa"]);

export const clusterType = clusterTypeEnum.enum;

export type ClusterType = z.infer<typeof clusterTypeEnum>;
