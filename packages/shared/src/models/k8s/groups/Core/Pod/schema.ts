import { z } from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectMetadataSchema,
} from "../../../common";

// Common schemas
const intOrStringSchema = z.union([z.string(), z.number().int()]);

// Container Port
const containerPortSchema = z.object({
  containerPort: z.number().int(),
  hostIP: z.string().optional(),
  hostPort: z.number().int().optional(),
  name: z.string().optional(),
  protocol: z.string().optional(),
});

// Volume Mount
const volumeMountSchema = z.object({
  mountPath: z.string(),
  mountPropagation: z.string().optional(),
  name: z.string(),
  readOnly: z.boolean().optional(),
  subPath: z.string().optional(),
  subPathExpr: z.string().optional(),
});

// Resource Requirements
const resourceRequirementsSchema = z.object({
  claims: z
    .array(
      z.object({
        name: z.string(),
        request: z.string().optional(),
      })
    )
    .optional(),
  limits: z.record(intOrStringSchema).optional(),
  requests: z.record(intOrStringSchema).optional(),
});

// Environment Variable
const envVarSourceSchema = z.object({
  configMapKeyRef: z
    .object({
      key: z.string(),
      name: z.string().optional(),
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
      divisor: intOrStringSchema.optional(),
      resource: z.string(),
    })
    .optional(),
  secretKeyRef: z
    .object({
      key: z.string(),
      name: z.string().optional(),
      optional: z.boolean().optional(),
    })
    .optional(),
});

const envVarSchema = z.object({
  name: z.string(),
  value: z.string().optional(),
  valueFrom: envVarSourceSchema.optional(),
});

// Probes
const execActionSchema = z.object({
  command: z.array(z.string()).optional(),
});

const httpHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
});

const httpGetActionSchema = z.object({
  host: z.string().optional(),
  httpHeaders: z.array(httpHeaderSchema).optional(),
  path: z.string().optional(),
  port: intOrStringSchema,
  scheme: z.string().optional(),
});

const tcpSocketActionSchema = z.object({
  host: z.string().optional(),
  port: intOrStringSchema,
});

const grpcActionSchema = z.object({
  port: z.number().int(),
  service: z.string().optional(),
});

const probeSchema = z.object({
  exec: execActionSchema.optional(),
  failureThreshold: z.number().int().optional(),
  grpc: grpcActionSchema.optional(),
  httpGet: httpGetActionSchema.optional(),
  initialDelaySeconds: z.number().int().optional(),
  periodSeconds: z.number().int().optional(),
  successThreshold: z.number().int().optional(),
  tcpSocket: tcpSocketActionSchema.optional(),
  terminationGracePeriodSeconds: z.number().int().optional(),
  timeoutSeconds: z.number().int().optional(),
});

// Lifecycle
const handlerSchema = z.object({
  exec: execActionSchema.optional(),
  httpGet: httpGetActionSchema.optional(),
  tcpSocket: tcpSocketActionSchema.optional(),
});

const lifecycleSchema = z.object({
  postStart: handlerSchema.optional(),
  preStop: handlerSchema.optional(),
});

// Security Context
const seLinuxOptionsSchema = z.object({
  level: z.string().optional(),
  role: z.string().optional(),
  type: z.string().optional(),
  user: z.string().optional(),
});

const seccompProfileSchema = z.object({
  localhostProfile: z.string().optional(),
  type: z.string(),
});

const windowsOptionsSchema = z.object({
  gmsaCredentialName: z.string().optional(),
  gmsaCredentialSpec: z.string().optional(),
  hostProcess: z.boolean().optional(),
  runAsUserName: z.string().optional(),
});

const securityContextSchema = z.object({
  allowPrivilegeEscalation: z.boolean().optional(),
  capabilities: z
    .object({
      add: z.array(z.string()).optional(),
      drop: z.array(z.string()).optional(),
    })
    .optional(),
  privileged: z.boolean().optional(),
  procMount: z.string().optional(),
  readOnlyRootFilesystem: z.boolean().optional(),
  runAsGroup: z.number().int().optional(),
  runAsNonRoot: z.boolean().optional(),
  runAsUser: z.number().int().optional(),
  seLinuxOptions: seLinuxOptionsSchema.optional(),
  seccompProfile: seccompProfileSchema.optional(),
  windowsOptions: windowsOptionsSchema.optional(),
});

// Container schema (main containers, init containers, ephemeral containers)
const containerSchema = z.object({
  name: z.string(),
  image: z.string().optional(),
  command: z.array(z.string()).optional(),
  args: z.array(z.string()).optional(),
  workingDir: z.string().optional(),
  ports: z.array(containerPortSchema).optional(),
  envFrom: z
    .array(
      z.object({
        configMapRef: z
          .object({
            name: z.string().optional(),
            optional: z.boolean().optional(),
          })
          .optional(),
        prefix: z.string().optional(),
        secretRef: z
          .object({
            name: z.string().optional(),
            optional: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .optional(),
  env: z.array(envVarSchema).optional(),
  resources: resourceRequirementsSchema.optional(),
  resizePolicy: z
    .array(
      z.object({
        resourceName: z.string(),
        restartPolicy: z.string(),
      })
    )
    .optional(),
  restartPolicy: z.string().optional(),
  volumeMounts: z.array(volumeMountSchema).optional(),
  volumeDevices: z
    .array(
      z.object({
        devicePath: z.string(),
        name: z.string(),
      })
    )
    .optional(),
  livenessProbe: probeSchema.optional(),
  readinessProbe: probeSchema.optional(),
  startupProbe: probeSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
  terminationMessagePath: z.string().optional(),
  terminationMessagePolicy: z.string().optional(),
  imagePullPolicy: z.string().optional(),
  securityContext: securityContextSchema.optional(),
  stdin: z.boolean().optional(),
  stdinOnce: z.boolean().optional(),
  tty: z.boolean().optional(),
});

// Ephemeral Container (extends container with additional fields)
const ephemeralContainerSchema = containerSchema.extend({
  targetContainerName: z.string().optional(),
});

// Container State
const containerStateSchema = z.object({
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
    .optional(),
  waiting: z
    .object({
      message: z.string().optional(),
      reason: z.string().optional(),
    })
    .optional(),
});

// Container Status
const containerStatusSchema = z.object({
  name: z.string(),
  state: containerStateSchema.optional(),
  lastState: containerStateSchema.optional(),
  ready: z.boolean(),
  restartCount: z.number().int(),
  image: z.string(),
  imageID: z.string(),
  containerID: z.string().optional(),
  started: z.boolean().optional(),
  allocatedResources: z.record(intOrStringSchema).optional(),
  resources: z
    .object({
      limits: z.record(intOrStringSchema).optional(),
      requests: z.record(intOrStringSchema).optional(),
    })
    .optional(),
});

// Pod Conditions
const podConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  lastProbeTime: z.string().datetime().optional(),
  lastTransitionTime: z.string().datetime().optional(),
  reason: z.string().optional(),
  message: z.string().optional(),
});

// Pod Security Context
const podSecurityContextSchema = z.object({
  seLinuxOptions: seLinuxOptionsSchema.optional(),
  windowsOptions: windowsOptionsSchema.optional(),
  runAsUser: z.number().int().optional(),
  runAsGroup: z.number().int().optional(),
  runAsNonRoot: z.boolean().optional(),
  supplementalGroups: z.array(z.number().int()).optional(),
  fsGroup: z.number().int().optional(),
  sysctls: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  fsGroupChangePolicy: z.string().optional(),
  seccompProfile: seccompProfileSchema.optional(),
  supplementalGroupsPolicy: z.string().optional(),
});

// Affinity
const nodeSelectorTermSchema = z.object({
  matchExpressions: z
    .array(
      z.object({
        key: z.string(),
        operator: z.string(),
        values: z.array(z.string()).optional(),
      })
    )
    .optional(),
  matchFields: z
    .array(
      z.object({
        key: z.string(),
        operator: z.string(),
        values: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

const preferredSchedulingTermSchema = z.object({
  weight: z.number().int(),
  preference: nodeSelectorTermSchema,
});

const nodeAffinitySchema = z.object({
  requiredDuringSchedulingIgnoredDuringExecution: z
    .object({
      nodeSelectorTerms: z.array(nodeSelectorTermSchema),
    })
    .optional(),
  preferredDuringSchedulingIgnoredDuringExecution: z
    .array(preferredSchedulingTermSchema)
    .optional(),
});

const podAffinityTermSchema = z.object({
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
  matchLabelKeys: z.array(z.string()).optional(),
  mismatchLabelKeys: z.array(z.string()).optional(),
  namespaceSelector: z
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
  namespaces: z.array(z.string()).optional(),
  topologyKey: z.string(),
});

const weightedPodAffinityTermSchema = z.object({
  weight: z.number().int(),
  podAffinityTerm: podAffinityTermSchema,
});

const podAffinitySchema = z.object({
  requiredDuringSchedulingIgnoredDuringExecution: z
    .array(podAffinityTermSchema)
    .optional(),
  preferredDuringSchedulingIgnoredDuringExecution: z
    .array(weightedPodAffinityTermSchema)
    .optional(),
});

const affinitySchema = z.object({
  nodeAffinity: nodeAffinitySchema.optional(),
  podAffinity: podAffinitySchema.optional(),
  podAntiAffinity: podAffinitySchema.optional(),
});

// Tolerations
const tolerationSchema = z.object({
  key: z.string().optional(),
  operator: z.string().optional(),
  value: z.string().optional(),
  effect: z.string().optional(),
  tolerationSeconds: z.number().int().optional(),
});

// Host Aliases
const hostAliasSchema = z.object({
  ip: z.string(),
  hostnames: z.array(z.string()).optional(),
});

// Topology Spread Constraints
const topologySpreadConstraintSchema = z.object({
  maxSkew: z.number().int(),
  minDomains: z.number().int().optional(),
  topologyKey: z.string(),
  whenUnsatisfiable: z.string(),
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
  matchLabelKeys: z.array(z.string()).optional(),
  nodeAffinityPolicy: z.string().optional(),
  nodeTaintsPolicy: z.string().optional(),
});

// DNS Config
const podDNSConfigOptionSchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
});

const podDNSConfigSchema = z.object({
  nameservers: z.array(z.string()).optional(),
  searches: z.array(z.string()).optional(),
  options: z.array(podDNSConfigOptionSchema).optional(),
});

// Image Pull Secrets
const localObjectReferenceSchema = z.object({
  name: z.string().optional(),
});

// OS
const podOSSchema = z.object({
  name: z.string(),
});

// Resource Claims
const podResourceClaimSchema = z.object({
  name: z.string(),
  source: z
    .object({
      resourceClaimName: z.string().optional(),
      resourceClaimTemplateName: z.string().optional(),
    })
    .optional(),
});

// Scheduling Gates
const podSchedulingGateSchema = z.object({
  name: z.string(),
});

// Pod Spec Schema
const podSpecSchema = z.object({
  volumes: z.array(z.any()).optional(), // Complex volume types - using any for now
  initContainers: z.array(containerSchema).optional(),
  containers: z.array(containerSchema),
  ephemeralContainers: z.array(ephemeralContainerSchema).optional(),
  restartPolicy: z.string().optional(),
  terminationGracePeriodSeconds: z.number().int().optional(),
  activeDeadlineSeconds: z.number().int().optional(),
  dnsPolicy: z.string().optional(),
  nodeSelector: z.record(z.string()).optional(),
  serviceAccountName: z.string().optional(),
  serviceAccount: z.string().optional(), // Deprecated but still present
  automountServiceAccountToken: z.boolean().optional(),
  nodeName: z.string().optional(),
  hostNetwork: z.boolean().optional(),
  hostPID: z.boolean().optional(),
  hostIPC: z.boolean().optional(),
  shareProcessNamespace: z.boolean().optional(),
  securityContext: podSecurityContextSchema.optional(),
  imagePullSecrets: z.array(localObjectReferenceSchema).optional(),
  hostname: z.string().optional(),
  subdomain: z.string().optional(),
  affinity: affinitySchema.optional(),
  schedulerName: z.string().optional(),
  tolerations: z.array(tolerationSchema).optional(),
  hostAliases: z.array(hostAliasSchema).optional(),
  priorityClassName: z.string().optional(),
  priority: z.number().int().optional(),
  dnsConfig: podDNSConfigSchema.optional(),
  readinessGates: z
    .array(
      z.object({
        conditionType: z.string(),
      })
    )
    .optional(),
  runtimeClassName: z.string().optional(),
  enableServiceLinks: z.boolean().optional(),
  preemptionPolicy: z.string().optional(),
  overhead: z.record(intOrStringSchema).optional(),
  topologySpreadConstraints: z.array(topologySpreadConstraintSchema).optional(),
  setHostnameAsFQDN: z.boolean().optional(),
  os: podOSSchema.optional(),
  hostUsers: z.boolean().optional(),
  resourceClaims: z.array(podResourceClaimSchema).optional(),
  schedulingGates: z.array(podSchedulingGateSchema).optional(),
});

// Pod IP
const podIPSchema = z.object({
  ip: z.string(),
});

// Pod Status Schema
const podStatusSchema = z.object({
  phase: z.string().optional(),
  conditions: z.array(podConditionSchema).optional(),
  message: z.string().optional(),
  reason: z.string().optional(),
  nominatedNodeName: z.string().optional(),
  hostIP: z.string().optional(),
  hostIPs: z.array(podIPSchema).optional(),
  podIP: z.string().optional(),
  podIPs: z.array(podIPSchema).optional(),
  startTime: z.string().datetime().optional(),
  initContainerStatuses: z.array(containerStatusSchema).optional(),
  containerStatuses: z.array(containerStatusSchema).optional(),
  ephemeralContainerStatuses: z.array(containerStatusSchema).optional(),
  qosClass: z.string().optional(),
  resize: z.string().optional(),
  resourceClaimStatuses: z
    .array(
      z.object({
        name: z.string(),
        resourceClaimName: z.string().optional(),
      })
    )
    .optional(),
});

// Main Pod schemas
export const podSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Pod"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  spec: podSpecSchema,
  status: podStatusSchema.optional(),
});

export const podDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Pod"),
  apiVersion: z.literal("v1"),
  spec: podSpecSchema,
});
