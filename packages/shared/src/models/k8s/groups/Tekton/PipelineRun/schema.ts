import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../common";
import { pipelineSpecSchema, pipelineTypeEnum } from "../Pipeline/schema";
import { pipelineRunLabels } from "./labels";
import { pipelineRefSchema, whenExpressionSchema, paramValueSchema } from "../common/schema";
import { stepStateSchema } from "../TaskRun/schema";

const pipelineRunLabelsSchema = z
  .object({
    [pipelineRunLabels.pipelineType]: pipelineTypeEnum,
    [pipelineRunLabels.codebaseBranch]: z.string().optional(),
    [pipelineRunLabels.codebase]: z.string().optional(),
    [pipelineRunLabels.pipeline]: z.string().optional(),
    [pipelineRunLabels.cdPipeline]: z.string().optional(),
    [pipelineRunLabels.stage]: z.string().optional(),
    [pipelineRunLabels.cdStage]: z.string().optional(),
  })
  .catchall(z.string());

export const pipelineRunReasonEnum = z.enum([
  "started",
  "running",
  "cancelled",
  "succeeded",
  "completed",
  "failed",
  "pipelineruntimeout",
  "createrunfailed",
]);

export const pipelineRunStatusEnum = z.enum(["true", "false", "unknown"]);

const intOrStringSchema = z
  .union([z.number().int(), z.string()])
  .refine(
    (val) =>
      typeof val === "string"
        ? /^(\+|-)?(([0-9]+(\.[0-9]*)?)|(\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\+|-)?(([0-9]+(\.[0-9]*)?)|(\.[0-9]+))))?$/.test(
            val
          )
        : true,
    { message: "Invalid int-or-string format" }
  );

const paramSchema = paramValueSchema;

// pipelineRefSchema reused from common

const dnsConfigSchema = z.object({
  nameservers: z.array(z.string()).optional(),
  options: z
    .array(
      z.object({
        name: z.string().optional(),
        value: z.string().optional(),
      })
    )
    .optional(),
  searches: z.array(z.string()).optional(),
});

const envValueFromSchema = z.object({
  configMapKeyRef: z
    .object({
      key: z.string(),
      name: z.string().default(""),
      optional: z.boolean().optional(),
    })
    .optional(),
  fieldRef: z
    .object({
      apiVersion: z.string().optional(),
      fieldPath: z.string(),
    })
    .required({ fieldPath: true }),
  resourceFieldRef: z
    .object({
      containerName: z.string().optional(),
      divisor: intOrStringSchema.optional(),
      resource: z.string(),
    })
    .required({ resource: true }),
  secretKeyRef: z
    .object({
      key: z.string(),
      name: z.string().default(""),
      optional: z.boolean().optional(),
    })
    .optional(),
});

const envSchema = z
  .object({
    name: z.string(),
    value: z.string().optional(),
    valueFrom: envValueFromSchema.optional(),
  })
  .required({ name: true });

const hostAliasSchema = z
  .object({
    hostnames: z.array(z.string()).optional(),
    ip: z.string(),
  })
  .required({ ip: true });

const imagePullSecretSchema = z.object({
  name: z.string().default(""),
});

const labelSelectorSchema = z.object({
  matchExpressions: z
    .array(
      z
        .object({
          key: z.string(),
          operator: z.string(),
          values: z.array(z.string()).optional(),
        })
        .required({ key: true, operator: true })
    )
    .optional(),
  matchLabels: z.record(z.string()).optional(),
});

const topologySpreadConstraintSchema = z
  .object({
    labelSelector: labelSelectorSchema.optional(),
    matchLabelKeys: z.array(z.string()).optional(),
    maxSkew: z.number().int(),
    minDomains: z.number().int().optional(),
    nodeAffinityPolicy: z.string().optional(),
    nodeTaintsPolicy: z.string().optional(),
    topologyKey: z.string(),
    whenUnsatisfiable: z.string(),
  })
  .required({ maxSkew: true, topologyKey: true, whenUnsatisfiable: true });

const podTemplateSchema = z.object({
  affinity: z.any().optional(),
  automountServiceAccountToken: z.boolean().optional(),
  dnsConfig: dnsConfigSchema.optional(),
  dnsPolicy: z.string().optional(),
  enableServiceLinks: z.boolean().optional(),
  env: z.array(envSchema).optional(),
  hostAliases: z.array(hostAliasSchema).optional(),
  hostNetwork: z.boolean().optional(),
  imagePullSecrets: z.array(imagePullSecretSchema).optional(),
  nodeSelector: z.record(z.string()).optional(),
  priorityClassName: z.string().optional(),
  runtimeClassName: z.string().optional(),
  schedulerName: z.string().optional(),
  securityContext: z.any().optional(),
  tolerations: z
    .array(
      z.object({
        effect: z.string().optional(),
        key: z.string().optional(),
        operator: z.string().optional(),
        tolerationSeconds: z.number().int().optional(),
        value: z.string().optional(),
      })
    )
    .optional(),
  topologySpreadConstraints: z.array(topologySpreadConstraintSchema).optional(),
  volumes: z.any().optional(),
});

const resourceSpecSchema = z
  .object({
    type: z.string(),
    params: z.array(paramSchema),
    secrets: z
      .array(
        z
          .object({
            fieldName: z.string(),
            secretKey: z.string(),
            secretName: z.string(),
          })
          .required({ fieldName: true, secretKey: true, secretName: true })
      )
      .optional(),
  })
  .required({ params: true, type: true });

const resourceSchema = z.object({
  name: z.string().optional(),
  resourceRef: z
    .object({
      apiVersion: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  resourceSpec: resourceSpecSchema.optional(),
});

const computeResourcesSchema = z.object({
  claims: z
    .array(
      z
        .object({
          name: z.string(),
          request: z.string().optional(),
        })
        .required({ name: true })
    )
    .optional(),
  limits: z.record(intOrStringSchema).optional(),
  requests: z.record(intOrStringSchema).optional(),
});

const taskRunSpecSchema = z.object({
  computeResources: computeResourcesSchema.optional(),
  metadata: z
    .object({
      annotations: z.record(z.string()).optional(),
      labels: z.record(z.string()).optional(),
    })
    .optional(),
  pipelineTaskName: z.string().optional(),
  sidecarOverrides: z
    .array(
      z
        .object({
          name: z.string(),
          resources: computeResourcesSchema,
        })
        .required({ name: true, resources: true })
    )
    .optional(),
  stepOverrides: z
    .array(
      z
        .object({
          name: z.string(),
          resources: computeResourcesSchema,
        })
        .required({ name: true, resources: true })
    )
    .optional(),
  taskPodTemplate: podTemplateSchema.optional(),
  taskServiceAccountName: z.string().optional(),
});

const workspaceSchema = z
  .object({
    name: z.string(),
    configMap: z
      .object({
        defaultMode: z.number().int().optional(),
        items: z
          .array(
            z
              .object({
                key: z.string(),
                mode: z.number().int().optional(),
                path: z.string(),
              })
              .required({ key: true, path: true })
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
      .required({ driver: true }),
    emptyDir: z
      .object({
        medium: z.string().optional(),
        sizeLimit: intOrStringSchema.optional(),
      })
      .optional(),
    persistentVolumeClaim: z
      .object({
        claimName: z.string(),
        readOnly: z.boolean().optional(),
      })
      .required({ claimName: true }),
    projected: z
      .object({
        defaultMode: z.number().int().optional(),
        sources: z
          .array(
            z.object({
              clusterTrustBundle: z
                .object({
                  labelSelector: labelSelectorSchema.optional(),
                  name: z.string().optional(),
                  optional: z.boolean().optional(),
                  path: z.string(),
                  signerName: z.string().optional(),
                })
                .required({ path: true }),
              configMap: z
                .object({
                  items: z
                    .array(
                      z
                        .object({
                          key: z.string(),
                          mode: z.number().int().optional(),
                          path: z.string(),
                        })
                        .required({ key: true, path: true })
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
                          .required({ fieldPath: true }),
                        mode: z.number().int().optional(),
                        path: z.string(),
                        resourceFieldRef: z
                          .object({
                            containerName: z.string().optional(),
                            divisor: intOrStringSchema.optional(),
                            resource: z.string(),
                          })
                          .required({ resource: true }),
                      })
                    )
                    .optional(),
                })
                .optional(),
              secret: z
                .object({
                  items: z
                    .array(
                      z
                        .object({
                          key: z.string(),
                          mode: z.number().int().optional(),
                          path: z.string(),
                        })
                        .required({ key: true, path: true })
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
                .required({ path: true }),
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
            z
              .object({
                key: z.string(),
                mode: z.number().int().optional(),
                path: z.string(),
              })
              .required({ key: true, path: true })
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

const specSchema = z.object({
  params: z.array(paramSchema).optional(),
  pipelineRef: pipelineRefSchema.optional(),
  pipelineSpec: pipelineSpecSchema.optional(),
  podTemplate: podTemplateSchema.optional(),
  resources: z.array(resourceSchema).optional(),
  serviceAccountName: z.string().optional(),
  status: z.string().optional(),
  taskRunSpecs: z.array(taskRunSpecSchema).optional(),
  timeout: z.string().optional(),
  timeouts: z
    .object({
      finally: z.string().optional(),
      pipeline: z.string().optional(),
      tasks: z.string().optional(),
    })
    .optional(),
  workspaces: z.array(workspaceSchema).optional(),
});

const statusSchema = z.object({
  annotations: z.record(z.string()).optional(),
  childReferences: z
    .array(
      z.object({
        apiVersion: z.string().optional(),
        displayName: z.string().optional(),
        kind: z.string().optional(),
        name: z.string().optional(),
        pipelineTaskName: z.string().optional(),
        whenExpressions: z.array(whenExpressionSchema).optional(),
      })
    )
    .optional(),
  completionTime: z.string().datetime().optional(),
  conditions: z
    .array(
      z
        .object({
          lastTransitionTime: z.string().optional(),
          message: z.string().optional(),
          reason: pipelineRunReasonEnum.optional(),
          severity: z.string().optional(),
          status: z.string(),
          type: z.string(),
        })
        .required({ status: true, type: true })
    )
    .optional(),
  finallyStartTime: z.string().datetime().optional(),
  observedGeneration: z.number().int().optional(),
  results: z
    .array(
      z
        .object({
          name: z.string(),
          value: z.any(),
        })
        .required({ name: true, value: true })
    )
    .optional(),
  pipelineSpec: pipelineSpecSchema.optional(),
  provenance: z
    .object({
      configSource: z
        .object({
          digest: z.record(z.string()).optional(),
          entryPoint: z.string().optional(),
          uri: z.string().optional(),
        })
        .optional(),
      featureFlags: z
        .object({
          awaitSidecarReadiness: z.boolean().optional(),
          coschedule: z.string().optional(),
          disableCredsInit: z.boolean().optional(),
          disableInlineSpec: z.string().optional(),
          enableAPIFields: z.string().optional(),
          enableArtifacts: z.boolean().optional(),
          enableCELInWhenExpression: z.boolean().optional(),
          enableConciseResolverSyntax: z.boolean().optional(),
          enableKeepPodOnCancel: z.boolean().optional(),
          enableKubernetesSidecar: z.boolean().optional(),
          enableParamEnum: z.boolean().optional(),
          enableProvenanceInStatus: z.boolean().optional(),
          enableStepActions: z.boolean().optional(),
          enforceNonfalsifiability: z.string().optional(),
          maxResultSize: z.number().int().optional(),
          requireGitSSHSecretKnownHosts: z.boolean().optional(),
          resultExtractionMethod: z.string().optional(),
          runningInEnvWithInjectedSidecars: z.boolean().optional(),
          sendCloudEventsForRuns: z.boolean().optional(),
          setSecurityContext: z.boolean().optional(),
          setSecurityContextReadOnlyRootFilesystem: z.boolean().optional(),
          verificationNoMatchPolicy: z.string().optional(),
        })
        .optional(),
      refSource: z
        .object({
          digest: z.record(z.string()).optional(),
          entryPoint: z.string().optional(),
          uri: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  runs: z
    .record(
      z.object({
        pipelineTaskName: z.string().optional(),
        status: z
          .object({
            annotations: z.record(z.string()).optional(),
            completionTime: z.string().datetime().optional(),
            conditions: z
              .array(
                z.object({
                  lastTransitionTime: z.string().optional(),
                  message: z.string().optional(),
                  reason: z.string().optional(),
                  severity: z.string().optional(),
                  status: z.string(),
                  type: z.string(),
                })
              )
              .optional(),
            extraFields: z.any().optional(),
            observedGeneration: z.number().int().optional(),
            results: z
              .array(
                z.object({
                  name: z.string(),
                  value: z.string(),
                })
              )
              .optional(),
            retriesStatus: z.any().optional(),
            startTime: z.string().datetime().optional(),
            whenExpressions: z.array(whenExpressionSchema).optional(),
          })
          .optional(),
      })
    )
    .optional(),
  skippedTasks: z
    .array(
      z
        .object({
          name: z.string(),
          reason: z.string(),
          whenExpressions: z.array(whenExpressionSchema).optional(),
        })
        .required({ name: true, reason: true })
    )
    .optional(),
  spanContext: z.record(z.string()).optional(),
  startTime: z.string().datetime().optional(),
  taskRuns: z
    .record(
      z.object({
        pipelineTaskName: z.string().optional(),
        status: z
          .object({
            annotations: z.record(z.string()).optional(),
            cloudEvents: z
              .array(
                z.object({
                  status: z
                    .object({
                      condition: z.string().optional(),
                      message: z.string(),
                      retryCount: z.number().int(),
                      sentAt: z.string().datetime().optional(),
                    })
                    .required({ message: true, retryCount: true }),
                  target: z.string().optional(),
                })
              )
              .optional(),
            completionTime: z.string().datetime().optional(),
            conditions: z
              .array(
                z.object({
                  lastTransitionTime: z.string().optional(),
                  message: z.string().optional(),
                  reason: z.string().optional(),
                  severity: z.string().optional(),
                  status: z.string(),
                  type: z.string(),
                })
              )
              .optional(),
            observedGeneration: z.number().int().optional(),
            podName: z.string(),
            provenance: z
              .object({
                configSource: z
                  .object({
                    digest: z.record(z.string()).optional(),
                    entryPoint: z.string().optional(),
                    uri: z.string().optional(),
                  })
                  .optional(),
                featureFlags: z
                  .object({
                    awaitSidecarReadiness: z.boolean().optional(),
                    coschedule: z.string().optional(),
                    disableCredsInit: z.boolean().optional(),
                    disableInlineSpec: z.string().optional(),
                    enableAPIFields: z.string().optional(),
                    enableArtifacts: z.boolean().optional(),
                    enableCELInWhenExpression: z.boolean().optional(),
                    enableConciseResolverSyntax: z.boolean().optional(),
                    enableKeepPodOnCancel: z.boolean().optional(),
                    enableKubernetesSidecar: z.boolean().optional(),
                    enableParamEnum: z.boolean().optional(),
                    enableProvenanceInStatus: z.boolean().optional(),
                    enableStepActions: z.boolean().optional(),
                    enforceNonfalsifiability: z.string().optional(),
                    maxResultSize: z.number().int().optional(),
                    requireGitSSHSecretKnownHosts: z.boolean().optional(),
                    resultExtractionMethod: z.string().optional(),
                    runningInEnvWithInjectedSidecars: z.boolean().optional(),
                    sendCloudEventsForRuns: z.boolean().optional(),
                    setSecurityContext: z.boolean().optional(),
                    setSecurityContextReadOnlyRootFilesystem: z.boolean().optional(),
                    verificationNoMatchPolicy: z.string().optional(),
                  })
                  .optional(),
                refSource: z
                  .object({
                    digest: z.record(z.string()).optional(),
                    entryPoint: z.string().optional(),
                    uri: z.string().optional(),
                  })
                  .optional(),
              })
              .optional(),
            resourcesResult: z
              .array(
                z.object({
                  key: z.string(),
                  resourceName: z.string().optional(),
                  type: z.number().int().optional(),
                  value: z.string(),
                })
              )
              .optional(),
            retriesStatus: z.any().optional(),
            sidecars: z
              .array(
                z.object({
                  container: z.string().optional(),
                  imageID: z.string().optional(),
                  name: z.string().optional(),
                  running: z
                    .object({
                      startedAt: z.string().datetime().optional(),
                    })
                    .optional(),
                  terminated: z
                    .object({
                      containerID: z.string().optional(),
                      exitCode: z.number().int(),
                      finishedAt: z.string().datetime().optional(),
                      message: z.string().optional(),
                      reason: z.string().optional(),
                      signal: z.number().int().optional(),
                      startedAt: z.string().datetime().optional(),
                    })
                    .required({ exitCode: true }),
                  waiting: z
                    .object({
                      message: z.string().optional(),
                      reason: z.string().optional(),
                    })
                    .optional(),
                })
              )
              .optional(),
            spanContext: z.record(z.string()).optional(),
            startTime: z.string().datetime().optional(),
            steps: z.array(stepStateSchema).optional(),
            taskResults: z
              .array(
                z.object({
                  name: z.string(),
                  type: z.string().optional(),
                  value: z.any(),
                })
              )
              .optional(),
            taskSpec: z.any().optional(),
            whenExpressions: z.array(whenExpressionSchema).optional(),
          })
          .required({ podName: true }),
      })
    )
    .optional(),
});

export const pipelineRunSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: pipelineRunLabelsSchema,
  }),
  spec: specSchema,
  status: statusSchema.optional(),
});

export const pipelineRunDraftSchema = kubeObjectBaseDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    labels: pipelineRunLabelsSchema,
  }),
  spec: specSchema,
});
