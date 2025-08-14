import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
} from "../../../core";

import * as z from "zod";

// Helper schema for int-or-string fields (x-kubernetes-int-or-string)
const intOrStringSchema = z.union([z.number().int(), z.string()]);

// Schema for params items
const paramSchema = z
  .object({
    default: z.any().optional(), // x-kubernetes-preserve-unknown-fields
    enum: z.array(z.string()).optional(),
    name: z.string(),
    properties: z
      .object({
        type: z.string().optional(),
      })
      .optional(),
    type: z.string().optional(),
  })
  .required({
    name: true,
  });

// Schema for resources inputs/outputs items
const resourceItemSchema = z
  .object({
    name: z.string(),
    optional: z.boolean().optional(),
    targetPath: z.string().optional(),
    type: z.string(),
  })
  .required({
    name: true,
    type: true,
  });

// Schema for results items
const resultSchema = z
  .object({
    name: z.string(),
    properties: z
      .object({
        type: z.string().optional(),
      })
      .optional(),
    type: z.string().optional(),
    value: z.any().optional(), // x-kubernetes-preserve-unknown-fields
  })
  .required({
    name: true,
  });

// Schema for valueFrom fields (used in env)
const valueFromSchema = z.object({
  configMapKeyRef: z
    .object({
      key: z.string(),
      name: z.string().default(""),
      optional: z.boolean().optional(),
    })
    .required({
      key: true,
    }),
  fieldRef: z
    .object({
      apiVersion: z.string().optional(),
      fieldPath: z.string(),
    })
    .required({
      fieldPath: true,
    }),
  resourceFieldRef: z
    .object({
      containerName: z.string().optional(),
      divisor: intOrStringSchema.optional(),
      resource: z.string(),
    })
    .required({
      resource: true,
    }),
  secretKeyRef: z
    .object({
      key: z.string(),
      name: z.string().default(""),
      optional: z.boolean().optional(),
    })
    .required({
      key: true,
    }),
});

// Schema for env items
const envSchema = z
  .object({
    name: z.string(),
    value: z.string().optional(),
    valueFrom: valueFromSchema.optional(),
  })
  .required({
    name: true,
  });

// Schema for envFrom items
const envFromSchema = z.object({
  configMapRef: z
    .object({
      name: z.string().default(""),
      optional: z.boolean().optional(),
    })
    .optional(),
  prefix: z.string().optional(),
  secretRef: z
    .object({
      name: z.string().default(""),
      optional: z.boolean().optional(),
    })
    .optional(),
});

// Schema for lifecycle hooks (postStart, preStop)
const lifecycleHookSchema = z.object({
  exec: z
    .object({
      command: z.array(z.string()).optional(),
    })
    .optional(),
  httpGet: z
    .object({
      host: z.string().optional(),
      httpHeaders: z
        .array(
          z
            .object({
              name: z.string(),
              value: z.string(),
            })
            .required({
              name: true,
              value: true,
            })
        )
        .optional(),
      path: z.string().optional(),
      port: intOrStringSchema,
      scheme: z.string().optional(),
    })
    .required({
      port: true,
    }),
  sleep: z
    .object({
      seconds: z.number().int().min(0),
    })
    .required({
      seconds: true,
    }),
  tcpSocket: z
    .object({
      host: z.string().optional(),
      port: intOrStringSchema,
    })
    .required({
      port: true,
    }),
});

// Schema for probes (livenessProbe, readinessProbe, startupProbe)
const probeSchema = z.object({
  exec: z
    .object({
      command: z.array(z.string()).optional(),
    })
    .optional(),
  failureThreshold: z.number().int().min(0).optional(),
  grpc: z
    .object({
      port: z.number().int().min(0),
      service: z.string().default(""),
    })
    .required({
      port: true,
    }),
  httpGet: z
    .object({
      host: z.string().optional(),
      httpHeaders: z
        .array(
          z
            .object({
              name: z.string(),
              value: z.string(),
            })
            .required({
              name: true,
              value: true,
            })
        )
        .optional(),
      path: z.string().optional(),
      port: intOrStringSchema,
      scheme: z.string().optional(),
    })
    .required({
      port: true,
    }),
  initialDelaySeconds: z.number().int().min(0).optional(),
  periodSeconds: z.number().int().min(0).optional(),
  successThreshold: z.number().int().min(0).optional(),
  tcpSocket: z
    .object({
      host: z.string().optional(),
      port: intOrStringSchema,
    })
    .required({
      port: true,
    }),
  terminationGracePeriodSeconds: z.number().int().min(0).optional(),
  timeoutSeconds: z.number().int().min(0).optional(),
});

// Schema for ports
const portSchema = z
  .object({
    containerPort: z.number().int().min(0),
    hostIP: z.string().optional(),
    hostPort: z.number().int().min(0).optional(),
    name: z.string().optional(),
    protocol: z.string().default("TCP"),
  })
  .required({
    containerPort: true,
  });

// Schema for resources
const resourcesSchema = z.object({
  claims: z
    .array(
      z
        .object({
          name: z.string(),
          request: z.string().optional(),
        })
        .required({
          name: true,
        })
    )
    .optional(),
  limits: z.record(intOrStringSchema).optional(),
  requests: z.record(intOrStringSchema).optional(),
});

// Schema for securityContext
const securityContextSchema = z.object({
  allowPrivilegeEscalation: z.boolean().optional(),
  appArmorProfile: z
    .object({
      localhostProfile: z.string().optional(),
      type: z.string(),
    })
    .required({
      type: true,
    }),
  capabilities: z
    .object({
      add: z.array(z.string()).optional(),
      drop: z.array(z.string()).optional(),
    })
    .optional(),
  privileged: z.boolean().optional(),
  procMount: z.string().optional(),
  readOnlyRootFilesystem: z.boolean().optional(),
  runAsGroup: z.number().int().min(0).optional(),
  runAsNonRoot: z.boolean().optional(),
  runAsUser: z.number().int().min(0).optional(),
  seLinuxOptions: z
    .object({
      level: z.string().optional(),
      role: z.string().optional(),
      type: z.string().optional(),
      user: z.string().optional(),
    })
    .optional(),
  seccompProfile: z
    .object({
      localhostProfile: z.string().optional(),
      type: z.string(),
    })
    .required({
      type: true,
    }),
  windowsOptions: z
    .object({
      gmsaCredentialSpec: z.string().optional(),
      gmsaCredentialSpecName: z.string().optional(),
      hostProcess: z.boolean().optional(),
      runAsUserName: z.string().optional(),
    })
    .optional(),
});

// Schema for volumeDevices
const volumeDeviceSchema = z
  .object({
    devicePath: z.string(),
    name: z.string(),
  })
  .required({
    devicePath: true,
    name: true,
  });

// Schema for volumeMounts
const volumeMountSchema = z
  .object({
    mountPath: z.string(),
    mountPropagation: z.string().optional(),
    name: z.string(),
    readOnly: z.boolean().optional(),
    recursiveReadOnly: z.string().optional(),
    subPath: z.string().optional(),
    subPathExpr: z.string().optional(),
  })
  .required({
    mountPath: true,
    name: true,
  });

// Schema for workspaces
const workspaceSchema = z
  .object({
    mountPath: z.string().optional(),
    name: z.string(),
    optional: z.boolean().optional(),
    readOnly: z.boolean().optional(),
    type: z.string().optional(),
  })
  .required({
    name: true,
  });

// Schema for sidecars
const sidecarSchema = z
  .object({
    args: z.array(z.string()).optional(),
    command: z.array(z.string()).optional(),
    env: z.array(envSchema).optional(),
    envFrom: z.array(envFromSchema).optional(),
    image: z.string().optional(),
    imagePullPolicy: z.string().optional(),
    lifecycle: z
      .object({
        postStart: lifecycleHookSchema.optional(),
        preStop: lifecycleHookSchema.optional(),
      })
      .optional(),
    livenessProbe: probeSchema.optional(),
    name: z.string(),
    ports: z.array(portSchema).optional(),
    readinessProbe: probeSchema.optional(),
    resources: resourcesSchema.optional(),
    restartPolicy: z.string().optional(),
    script: z.string().optional(),
    securityContext: securityContextSchema.optional(),
    startupProbe: probeSchema.optional(),
    stdin: z.boolean().optional(),
    stdinOnce: z.boolean().optional(),
    terminationMessagePath: z.string().optional(),
    terminationMessagePolicy: z.string().optional(),
    tty: z.boolean().optional(),
    volumeDevices: z.array(volumeDeviceSchema).optional(),
    volumeMounts: z.array(volumeMountSchema).optional(),
    workingDir: z.string().optional(),
    workspaces: z.array(workspaceSchema).optional(),
  })
  .required({
    name: true,
  });

// Schema for stepTemplate and steps
const stepBaseSchema = z
  .object({
    args: z.array(z.string()).optional(),
    command: z.array(z.string()).optional(),
    env: z.array(envSchema).optional(),
    envFrom: z.array(envFromSchema).optional(),
    image: z.string().optional(),
    imagePullPolicy: z.string().optional(),
    lifecycle: z
      .object({
        postStart: lifecycleHookSchema.optional(),
        preStop: lifecycleHookSchema.optional(),
      })
      .optional(),
    livenessProbe: probeSchema.optional(),
    name: z.string(),
    ports: z.array(portSchema).optional(),
    readinessProbe: probeSchema.optional(),
    resources: resourcesSchema.optional(),
    securityContext: securityContextSchema.optional(),
    startupProbe: probeSchema.optional(),
    stdin: z.boolean().optional(),
    stdinOnce: z.boolean().optional(),
    terminationMessagePath: z.string().optional(),
    terminationMessagePolicy: z.string().optional(),
    tty: z.boolean().optional(),
    volumeDevices: z.array(volumeDeviceSchema).optional(),
    volumeMounts: z.array(volumeMountSchema).optional(),
    workingDir: z.string().optional(),
  })
  .required({
    name: true,
  });

const stepSchema = stepBaseSchema.extend({
  onError: z.string().optional(),
  params: z
    .array(
      z
        .object({
          name: z.string(),
          value: z.any(), // x-kubernetes-preserve-unknown-fields
        })
        .required({
          name: true,
          value: true,
        })
    )
    .optional(),
  ref: z
    .object({
      name: z.string().optional(),
      params: z
        .array(
          z
            .object({
              name: z.string(),
              value: z.any(), // x-kubernetes-preserve-unknown-fields
            })
            .required({
              name: true,
              value: true,
            })
        )
        .optional(),
      resolver: z.string().optional(),
    })
    .optional(),
  results: z.array(resultSchema).optional(),
  script: z.string().optional(),
  stderrConfig: z
    .object({
      path: z.string().optional(),
    })
    .optional(),
  stdoutConfig: z
    .object({
      path: z.string().optional(),
    })
    .optional(),
  timeout: z.string().optional(),
  when: z
    .array(
      z.object({
        cel: z.string().optional(),
        input: z.string().optional(),
        operator: z.string().optional(),
        values: z.array(z.string()).optional(),
      })
    )
    .optional(),
  workspaces: z.array(workspaceSchema).optional(),
});

// Schema for spec
const specSchema = z.object({
  description: z.string().optional(),
  type: z.string().optional(),
  displayName: z.string().optional(),
  params: z.array(paramSchema).optional(),
  resources: z
    .object({
      inputs: z.array(resourceItemSchema).optional(),
      outputs: z.array(resourceItemSchema).optional(),
    })
    .optional(),
  results: z.array(resultSchema).optional(),
  sidecars: z.array(sidecarSchema).optional(),
  stepTemplate: stepBaseSchema.optional(),
  steps: z.array(stepSchema).optional(),
  volumes: z.any().optional(), // x-kubernetes-preserve-unknown-fields
  workspaces: z.array(workspaceSchema).optional(),
});

// Main schema
export const taskSchema = kubeObjectBaseSchema.extend({
  spec: specSchema,
});

export const taskDraftSchema = kubeObjectBaseDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema,
  spec: specSchema,
});
