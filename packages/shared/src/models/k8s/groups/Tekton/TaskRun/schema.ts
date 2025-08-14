import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../core";
import { taskRunLabels } from "./labels";
import {
  paramValueSchema,
  taskRefSchema,
  whenExpressionSchema,
} from "../common/schema";

const resourceQuantitySchema = z.union([
  z.number().int(),
  z
    .string()
    .regex(
      /^(\+|-)?(([0-9]+(\.[0-9]*)?)|(\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\+|-)?(([0-9]+(\.[0-9]*)?)|(\.[0-9]+))))?$/
    ),
]);

const resourceClaimSchema = z
  .object({
    name: z.string(),
    request: z.string().optional(),
  })
  .required({ name: true });

const computeResourcesSchema = z.object({
  claims: z.array(resourceClaimSchema).optional(),
  limits: z.record(resourceQuantitySchema).optional(),
  requests: z.record(resourceQuantitySchema).optional(),
});

const breakpointsSchema = z.object({
  beforeSteps: z.array(z.string()).optional(),
  onFailure: z.string().optional(),
});

const debugSchema = z.object({
  breakpoints: breakpointsSchema.optional(),
});

const paramSchema = paramValueSchema;

const dnsConfigOptionSchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
});

const dnsConfigSchema = z.object({
  nameservers: z.array(z.string()).optional(),
  options: z.array(dnsConfigOptionSchema).optional(),
  searches: z.array(z.string()).optional(),
});

const envVarSourceSchema = z.object({
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
    .optional(),
  resourceFieldRef: z
    .object({
      containerName: z.string().optional(),
      divisor: resourceQuantitySchema.optional(),
      resource: z.string(),
    })
    .optional(),
  secretKeyRef: z
    .object({
      key: z.string(),
      name: z.string().default(""),
      optional: z.boolean().optional(),
    })
    .optional(),
});

const envVarSchema = z
  .object({
    name: z.string(),
    value: z.string().optional(),
    valueFrom: envVarSourceSchema.optional(),
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

const tolerationSchema = z.object({
  effect: z.string().optional(),
  key: z.string().optional(),
  operator: z.string().optional(),
  tolerationSeconds: z.number().int().optional(),
  value: z.string().optional(),
});

const labelSelectorRequirementSchema = z
  .object({
    key: z.string(),
    operator: z.string(),
    values: z.array(z.string()).optional(),
  })
  .required({ key: true, operator: true });

const labelSelectorSchema = z.object({
  matchExpressions: z.array(labelSelectorRequirementSchema).optional(),
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

const resourceParamSchema = z
  .object({
    name: z.string(),
    value: z.string(),
  })
  .required({ name: true, value: true });

const secretParamSchema = z
  .object({
    fieldName: z.string(),
    secretKey: z.string(),
    secretName: z.string(),
  })
  .required({ fieldName: true, secretKey: true, secretName: true });

const resourceSpecSchema = z
  .object({
    params: z.array(resourceParamSchema),
    secrets: z.array(secretParamSchema).optional(),
    type: z.string(),
  })
  .required({ params: true, type: true });

const resourceBindingSchema = z.object({
  name: z.string().optional(),
  paths: z.array(z.string()).optional(),
  resourceRef: z
    .object({
      apiVersion: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  resourceSpec: resourceSpecSchema.optional(),
});

const resourcesSchema = z.object({
  inputs: z.array(resourceBindingSchema).optional(),
  outputs: z.array(resourceBindingSchema).optional(),
});

const sidecarOverrideSchema = z
  .object({
    name: z.string(),
    resources: computeResourcesSchema,
  })
  .required({ name: true, resources: true });

const stepOverrideSchema = z
  .object({
    name: z.string(),
    resources: computeResourcesSchema,
  })
  .required({ name: true, resources: true });

const taskRefParamSchema = paramValueSchema;

// Reuse shared TaskRef schema

const configMapItemSchema = z
  .object({
    key: z.string(),
    mode: z.number().int().optional(),
    path: z.string(),
  })
  .required({ key: true, path: true });

const configMapSchema = z.object({
  defaultMode: z.number().int().optional(),
  items: z.array(configMapItemSchema).optional(),
  name: z.string().default(""),
  optional: z.boolean().optional(),
});

const csiSchema = z
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
  .required({ driver: true });

const emptyDirSchema = z.object({
  medium: z.string().optional(),
  sizeLimit: resourceQuantitySchema.optional(),
});

const persistentVolumeClaimSchema = z
  .object({
    claimName: z.string(),
    readOnly: z.boolean().optional(),
  })
  .required({ claimName: true });

const projectedSourceSchema = z.object({
  clusterTrustBundle: z
    .object({
      labelSelector: labelSelectorSchema.optional(),
      name: z.string().optional(),
      optional: z.boolean().optional(),
      path: z.string(),
      signerName: z.string().optional(),
    })
    .optional(),
  configMap: configMapSchema.optional(),
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
                divisor: resourceQuantitySchema.optional(),
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
      items: z.array(configMapItemSchema).optional(),
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
});

const projectedSchema = z.object({
  defaultMode: z.number().int().optional(),
  sources: z.array(projectedSourceSchema).optional(),
});

const secretSchema = z.object({
  defaultMode: z.number().int().optional(),
  items: z.array(configMapItemSchema).optional(),
  optional: z.boolean().optional(),
  secretName: z.string().optional(),
});

const workspaceBindingSchema = z
  .object({
    configMap: configMapSchema.optional(),
    csi: csiSchema.optional(),
    emptyDir: emptyDirSchema.optional(),
    name: z.string(),
    persistentVolumeClaim: persistentVolumeClaimSchema.optional(),
    projected: projectedSchema.optional(),
    secret: secretSchema.optional(),
    subPath: z.string().optional(),
    volumeClaimTemplate: z.any().optional(),
  })
  .required({ name: true });

const podTemplateSchema = z.object({
  affinity: z.any().optional(),
  automountServiceAccountToken: z.boolean().optional(),
  dnsConfig: dnsConfigSchema.optional(),
  dnsPolicy: z.string().optional(),
  enableServiceLinks: z.boolean().optional(),
  env: z.array(envVarSchema).optional(),
  hostAliases: z.array(hostAliasSchema).optional(),
  hostNetwork: z.boolean().optional(),
  imagePullSecrets: z.array(imagePullSecretSchema).optional(),
  nodeSelector: z.record(z.string()).optional(),
  priorityClassName: z.string().optional(),
  runtimeClassName: z.string().optional(),
  schedulerName: z.string().optional(),
  securityContext: z.any().optional(),
  tolerations: z.array(tolerationSchema).optional(),
  topologySpreadConstraints: z.array(topologySpreadConstraintSchema).optional(),
  volumes: z.any().optional(),
});

const taskRunSpecSchema = z.object({
  computeResources: computeResourcesSchema.optional(),
  debug: debugSchema.optional(),
  params: z.array(paramSchema).optional(),
  podTemplate: podTemplateSchema.optional(),
  resources: resourcesSchema.optional(),
  retries: z.number().int().optional(),
  serviceAccountName: z.string().optional(),
  sidecarOverrides: z.array(sidecarOverrideSchema).optional(),
  status: z.string().optional(),
  statusMessage: z.string().optional(),
  stepOverrides: z.array(stepOverrideSchema).optional(),
  taskRef: taskRefSchema.optional(),
  taskSpec: z.any().optional(),
  timeout: z.string().optional(),
  workspaces: z.array(workspaceBindingSchema).optional(),
});

const cloudEventDeliveryStatusSchema = z
  .object({
    condition: z.string().optional(),
    message: z.string(),
    retryCount: z.number().int(),
    sentAt: z.string().optional(),
  })
  .required({ message: true, retryCount: true });

const cloudEventDeliverySchema = z.object({
  status: cloudEventDeliveryStatusSchema.optional(),
  target: z.string().optional(),
});

export const statusSchema = z.enum(["true", "false", "unknown"]);

export const reasonSchema = z.enum([
  "started",
  "pending",
  "running",
  "TaskRunCancelled",
  "succeeded",
  "failed",
  "taskruntimeout",
  "taskrunimagepullfailed",
]);

const conditionSchema = z
  .object({
    lastTransitionTime: z.string().optional(),
    message: z.string().optional(),
    reason: reasonSchema.optional(),
    severity: z.string().optional(),
    status: statusSchema,
    type: z.string(),
  })
  .required({ status: true, type: true });

const provenanceSchema = z.object({
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
});

const runResultSchema = z
  .object({
    key: z.string(),
    resourceName: z.string().optional(),
    type: z.number().int().optional(),
    value: z.string(),
  })
  .required({ key: true, value: true });

export const taskRunStepReasonFieldNameEnum = z.enum(["Completed"]);

const containerStateRunningSchema = z.object({
  startedAt: z.string().optional(),
});

const containerStateTerminatedSchema = z
  .object({
    containerID: z.string().optional(),
    exitCode: z.number().int(),
    finishedAt: z.string().optional(),
    message: z.string().optional(),
    reason: taskRunStepReasonFieldNameEnum.optional(),
    signal: z.number().int().optional(),
    startedAt: z.string().optional(),
  })
  .required({ exitCode: true });

const containerStateWaitingSchema = z.object({
  message: z.string().optional(),
  reason: taskRunStepReasonFieldNameEnum.optional(),
});

const artifactValueSchema = z.object({
  digest: z.record(z.string()).optional(),
  uri: z.string().optional(),
});

const artifactSchema = z.object({
  buildOutput: z.boolean().optional(),
  name: z.string().optional(),
  values: z.array(artifactValueSchema).optional(),
});

export const stepStateSchema = z.object({
  container: z.string().optional(),
  imageID: z.string().optional(),
  inputs: z.array(artifactSchema).optional(),
  name: z.string().optional(),
  outputs: z.array(artifactSchema).optional(),
  provenance: provenanceSchema.optional(),
  results: z
    .array(
      z
        .object({
          name: z.string(),
          type: z.string().optional(),
          value: z.any(),
        })
        .required({ name: true, value: true })
    )
    .optional(),
  running: containerStateRunningSchema.optional(),
  terminated: containerStateTerminatedSchema.optional(),
  waiting: containerStateWaitingSchema.optional(),
});

const sidecarStateSchema = z.object({
  container: z.string().optional(),
  imageID: z.string().optional(),
  name: z.string().optional(),
  running: containerStateRunningSchema.optional(),
  terminated: containerStateTerminatedSchema.optional(),
  waiting: containerStateWaitingSchema.optional(),
});

const taskRunResultSchema = z
  .object({
    name: z.string(),
    type: z.string().optional(),
    value: z.any(),
  })
  .required({ name: true, value: true });

const taskRunStatusSchema = z
  .object({
    annotations: z.record(z.string()).optional(),
    cloudEvents: z.array(cloudEventDeliverySchema).optional(),
    completionTime: z.string().optional(),
    conditions: z.array(conditionSchema).optional(),
    observedGeneration: z.number().int().optional(),
    podName: z.string(),
    provenance: provenanceSchema.optional(),
    resourcesResult: z.array(runResultSchema).optional(),
    retriesStatus: z.any().optional(),
    sidecars: z.array(sidecarStateSchema).optional(),
    spanContext: z.record(z.string()).optional(),
    startTime: z.string().optional(),
    steps: z.array(stepStateSchema).optional(),
    taskResults: z.array(taskRunResultSchema).optional(),
    taskSpec: z.any().optional(),
    results: z.array(taskRunResultSchema).optional(),
  })
  .required({ podName: true });

const taskRunLabelsSchema = z.object({
  [taskRunLabels.pipeline]: z.string(),
  [taskRunLabels.pipelineType]: z.string(),
  [taskRunLabels.parentPipelineRun]: z.string(),
  [taskRunLabels.pipelineTask]: z.string(),
});

export const taskRunSchema = kubeObjectBaseSchema
  .extend({
    metadata: kubeObjectMetadataSchema.extend({
      labels: taskRunLabelsSchema,
    }),
    spec: taskRunSpecSchema,
    status: taskRunStatusSchema.optional(),
  })
  .required();

export const taskRunStepStatusFieldNameEnum = z.enum([
  "running",
  "terminated",
  "waiting",
]);
