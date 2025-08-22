# Kubernetes Resource Definition Scaffold

## Shared Package Resource Structure

```
shared/src/k8s/groups/{{GroupName}}/{{ResourceName}}/
├── index.ts      # Main exports
├── types.ts      # TypeScript interfaces
├── schema.ts     # Zod schemas
├── config.ts     # Resource configuration
└── labels.ts     # Resource labels (if any)
```

## Required Files Template

### config.ts

```typescript
import { K8sResourceConfig } from "../../../types";
{{#if hasLabels}}
import { {{resourceName}}Labels } from "./labels";
{{/if}}

export const k8s{{ResourceName}}Config = {
  apiVersion: "{{group}}/{{version}}",
  kind: "{{ResourceName}}",
  group: "{{group}}",
  version: "{{version}}",
  singularName: "{{resourceName}}",
  pluralName: "{{resourceName}}s",
  {{#if hasLabels}}
  labels: {{resourceName}}Labels,
  {{/if}}
} as const satisfies K8sResourceConfig{{#if hasLabels}}<typeof {{resourceName}}Labels>{{/if}};
```

### types.ts

```typescript
import { z } from "zod";
import { {{resourceName}}Schema } from "./schema";

export type {{ResourceName}} = z.infer<typeof {{resourceName}}Schema>;
{{#if hasDraft}}
export type {{ResourceName}}Draft = z.infer<typeof {{resourceName}}DraftSchema>;
{{/if}}
```

### schema.ts

```typescript
import { z } from "zod";
import { kubeObjectBaseSchema } from "../../../core/KubeObjectBase";

export const {{resourceName}}Schema = kubeObjectBaseSchema.extend({
  spec: z.object({
    {{#each specFields}}
    {{field}}: {{validation}},
    {{/each}}
  }),
  status: z.object({
    {{#each statusFields}}
    {{field}}: {{validation}},
    {{/each}}
  }).optional(),
});

{{#if hasDraft}}
export const {{resourceName}}DraftSchema = {{resourceName}}Schema.omit({
  metadata: true,
  status: true,
}).extend({
  metadata: z.object({
    name: z.string(),
    namespace: z.string().optional(),
    {{#each additionalMetadata}}
    {{field}}: {{validation}},
    {{/each}}
  }),
});
{{/if}}
```

### labels.ts (if needed)

```typescript
export const {{resourceName}}Labels = {
  {{#each labels}}
  {{key}}: "{{value}}",
  {{/each}}
} as const;
```

### index.ts

```typescript
export * from './types';
export * from './config';
export * from './schema';
{{#if hasLabels}}
export * from './labels';
{{/if}}
```

## Client Usage Template

```typescript
// CORRECT - Import from shared
import { k8s{{ResourceName}}Config, {{ResourceName}} } from "@my-project/shared";

// Generate hooks
export const use{{ResourceName}}WatchList = createUseWatchListHook(k8s{{ResourceName}}Config);
export const use{{ResourceName}}WatchItem = createUseWatchItemHook(k8s{{ResourceName}}Config);
export const use{{ResourceName}}Permissions = createUsePermissionsHook(k8s{{ResourceName}}Config);
```

## Draft Creator Template (if needed)

```typescript
// shared/src/models/{{resourceName}}/index.ts
export const create{{ResourceName}}Draft = (data: {
  {{#each draftFields}}
  {{field}}: {{type}};
  {{/each}}
}): {{ResourceName}}Draft => ({
  metadata: {
    name: data.name,
    namespace: data.namespace,
  },
  spec: {
    {{#each specMapping}}
    {{field}}: data.{{sourceField}},
    {{/each}}
  },
});
```
