# API Integration Patterns

## Shared Schema Definition

```typescript
// packages/shared/src/models/{{resourceName}}/schema.ts
import { z } from "zod";

export const {{resourceName}}Schema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

export type {{ResourceName}} = z.infer<typeof {{resourceName}}Schema>;

// K8s Resource Config (if applicable)
export const k8s{{ResourceName}}Config = {
  apiVersion: "{{group}}/{{version}}",
  kind: "{{ResourceName}}",
  group: "{{group}}",
  version: "{{version}}",
  singularName: "{{resourceName}}",
  pluralName: "{{resourceName}}s",
} as const satisfies K8sResourceConfig;
```

## Server tRPC Procedures

```typescript
// apps/server/src/trpc/routers/{{resourceName}}.ts
export const {{resourceName}}Router = createTRPCRouter({
  procedureName: protectedProcedure
    .input(z.object({
      someParamName: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // code
    }),
});
```

## Permission Integration

```typescript
// hooks/index.ts - Permission Hook
export const use{{ResourceName}}Permissions = createUsePermissionsHook(k8s{{ResourceName}}Config);

// Component Usage
const {{ResourceName}}Actions = () => {
  const permissions = use{{ResourceName}}Permissions();

  return (
    <ButtonWithPermission
      allowed={permissions.data?.create.allowed}
      reason={permissions.data?.create.reason}
      ButtonProps={{ onClick: handleCreate }}
    >
      Create {{ResourceName}}
    </ButtonWithPermission>
  );
};
```

## Real-time WebSocket Integration

```typescript
// hooks/index.ts - Watch Hooks
export const use{{ResourceName}}WatchList = createUseWatchListHook(k8s{{ResourceName}}Config);
export const use{{ResourceName}}WatchItem = createUseWatchItemHook(k8s{{ResourceName}}Config);

// Component Usage
const {{ResourceName}}List = () => {
  const { data: {{resourceName}}s } = use{{ResourceName}}WatchList({
    namespace: 'default'
  });

  return (
    <Table
      data={ {{resourceName}}s || []}
      columns={columns}
    />
  );
};
```
