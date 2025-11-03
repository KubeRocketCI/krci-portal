import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common";
import { customRunLabels } from "./labels";

const customRunLabelsSchema = z.object({
  [customRunLabels.pipelineRun]: z.string().optional(),
  [customRunLabels.pipelineTask]: z.string().optional(),
});

const paramSchema = z
  .object({
    name: z.string(),
    value: z.any(),
  })
  .required();

const workspaceBindingSchema = z
  .object({
    name: z.string(),
    configMap: z
      .object({
        defaultMode: z.number().int().optional(),
        items: z
          .array(
            z.object({
              key: z.string(),
              mode: z.number().int().optional(),
              path: z.string(),
            })
          )
          .optional(),
        name: z.string().default(""),
        optional: z.boolean().optional(),
      })
      .optional(),
    csi: z
      .object({
        driver: z.string(),
        fsType: z.string().optional(),
        nodePublishSecretRef: z
          .object({
            name: z.string().default(""),
          })
          .optional(),
        readOnly: z.boolean().optional(),
        volumeAttributes: z.record(z.string()).optional(),
      })
      .optional(),
    emptyDir: z
      .object({
        medium: z.string().optional(),
        sizeLimit: z.union([z.number().int(), z.string()]).optional(),
      })
      .optional(),
    persistentVolumeClaim: z
      .object({
        claimName: z.string(),
        readOnly: z.boolean().optional(),
      })
      .optional(),
    projected: z
      .object({
        defaultMode: z.number().int().optional(),
        sources: z
          .array(
            z.object({
              clusterTrustBundle: z
                .object({
                  labelSelector: z
                    .object({
                      matchExpressions: z
                        .array(
                          z.object({
                            key: z.string(),
                            operator: z.string(),
                            values: z.array(z.string()).optional(),
                          })
                        )
                        .optional(),
                      matchLabels: z.record(z.string()).optional(),
                    })
                    .optional(),
                  name: z.string().optional(),
                  optional: z.boolean().optional(),
                  path: z.string(),
                  signerName: z.string().optional(),
                })
                .optional(),
              configMap: z
                .object({
                  items: z
                    .array(
                      z.object({
                        key: z.string(),
                        mode: z.number().int().optional(),
                        path: z.string(),
                      })
                    )
                    .optional(),
                  name: z.string().default(""),
                  optional: z.boolean().optional(),
                })
                .optional(),
              downwardAPI: z
                .object({
                  items: z
                    .array(
                      z.object({
                        fieldRef: z
                          .object({
                            apiVersion: z.string().optional(),
                            fieldPath: z.string(),
                          })
                          .optional(),
                        mode: z.number().int().optional(),
                        path: z.string(),
                        resourceFieldRef: z
                          .object({
                            containerName: z.string().optional(),
                            divisor: z.union([z.number().int(), z.string()]).optional(),
                            resource: z.string(),
                          })
                          .optional(),
                      })
                    )
                    .optional(),
                })
                .optional(),
              secret: z
                .object({
                  items: z
                    .array(
                      z.object({
                        key: z.string(),
                        mode: z.number().int().optional(),
                        path: z.string(),
                      })
                    )
                    .optional(),
                  name: z.string().default(""),
                  optional: z.boolean().optional(),
                })
                .optional(),
              serviceAccountToken: z
                .object({
                  audience: z.string().optional(),
                  expirationSeconds: z.number().int().optional(),
                  path: z.string(),
                })
                .optional(),
            })
          )
          .optional(),
      })
      .optional(),
    secret: z
      .object({
        defaultMode: z.number().int().optional(),
        items: z
          .array(
            z.object({
              key: z.string(),
              mode: z.number().int().optional(),
              path: z.string(),
            })
          )
          .optional(),
        optional: z.boolean().optional(),
        secretName: z.string().optional(),
      })
      .optional(),
    subPath: z.string().optional(),
    volumeClaimTemplate: z.any().optional(),
  })
  .required({ name: true });

const customRunSpecSchema = z.object({
  customRef: z
    .object({
      apiVersion: z.string().optional(),
      bundle: z.string().optional(),
      kind: z.string().optional(),
      name: z.string().optional(),
      params: z.array(paramSchema).optional(),
      resolver: z.string().optional(),
    })
    .optional(),
  customSpec: z
    .object({
      apiVersion: z.string().optional(),
      kind: z.string().optional(),
      metadata: z
        .object({
          annotations: z.record(z.string()).optional(),
          labels: z.record(z.string()).optional(),
        })
        .optional(),
      spec: z.any().optional(),
    })
    .optional(),
  params: z.array(paramSchema).optional(),
  retries: z.number().int().optional(),
  serviceAccountName: z.string().optional(),
  status: z.string().optional(),
  statusMessage: z.string().optional(),
  timeout: z.string().optional(),
  workspaces: z.array(workspaceBindingSchema).optional(),
});

const customRunStatusSchema = z.object({
  annotations: z.record(z.string()).optional(),
  completionTime: z.string().optional(),
  conditions: z
    .array(
      z
        .object({
          lastTransitionTime: z.string().optional(),
          message: z.string().optional(),
          reason: z.string().optional(),
          severity: z.string().optional(),
          status: z.string(),
          type: z.string(),
        })
        .required({ status: true, type: true })
    )
    .optional(),
  extraFields: z.any().optional(),
  observedGeneration: z.number().int().optional(),
  results: z
    .array(
      z
        .object({
          name: z.string(),
          value: z.string(),
        })
        .required({ name: true, value: true })
    )
    .optional(),
  retriesStatus: z.any().optional(),
  startTime: z.string().optional(),
});

export const customRunSchema = kubeObjectBaseSchema
  .extend({
    metadata: kubeObjectMetadataSchema.extend({
      labels: customRunLabelsSchema,
    }),
    spec: customRunSpecSchema,
    status: customRunStatusSchema.optional(),
  })
  .required({ spec: true });
