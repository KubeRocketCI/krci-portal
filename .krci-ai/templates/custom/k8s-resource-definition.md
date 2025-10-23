# Kubernetes Resource Definition Template

When working with K8s resources, ALWAYS follow this structure:

## 1. Shared Package Resource Definition
Location: `shared/src/k8s/groups/Core/{ResourceName}/`

### Required files:
- `index.ts` - Main exports
- `types.ts` - TypeScript interfaces
- `schema.ts` - Zod schemas
- `config.ts` - Resource configuration
- `labels.ts` - Resource labels (if any)

### Example structure for Pod:
```typescript
// shared/src/k8s/groups/Core/Pod/types.ts
export type Pod = z.infer<typeof podSchema>

// shared/src/k8s/groups/Core/Pod/config.ts
export const k8sPodConfig = {
  apiVersion: "v1",
  kind: "Pod",
  group: "",
  version: "v1",
  singularName: "pod",
  pluralName: "pods",
} as const satisfies K8sResourceConfig; // or as const satisfies K8sResourceConfig<typeof podLabels>

// shared/src/k8s/groups/Core/Pod/index.ts
export * from './types';
export * from './config';
export * from './schema';
```

## 2. Client Usage
```typescript
// CORRECT - Import from shared
import { k8sPodConfig, Pod } from "@my-project/shared";

// WRONG - Hardcoded config
const resourceConfig = {
  apiVersion: "v1",
  kind: "Pod",
  // ...
};
```

### Add to Principles section:
```yaml
principles:
  - "Always use shared package resource definitions, never hardcode configs"
  - "Create proper schemas in shared package before using types"
  - "Eliminate magic strings/numbers by declaring constants first"
  - "Remove unused variables and imports - don't copy-paste patterns blindly"
```

---

## 🔨 Immediate Fixes Needed:

1. Create proper Pod resource definition in shared package
2. Replace hardcoded resourceConfig with imported config
3. Use useWatchList for real-time pod updates instead of polling
4. Remove unused defaultNamespace from page.tsx
5. Create proper container and log-related schemas
