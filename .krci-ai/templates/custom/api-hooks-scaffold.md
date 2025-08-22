# API Hooks Template Scaffolds

## CRUD Mutation Hook Template

```typescript
// hooks/useCRUD.tsx
const {{resourceName}}CreateMutation = useResourceCRUDMutation<
  {{ResourceName}}Draft,
  typeof k8sOperation.create
>("{{resourceName}}CreateMutation", k8sOperation.create, {
  createCustomMessages: () => ({
    onMutate: { message: "Creating {{ResourceName}}" },
    onError: { message: "Failed to create {{ResourceName}}" },
    onSuccess: { message: "{{ResourceName}} created successfully" },
  }),
});

// Usage
{{resourceName}}CreateMutation.mutate({
  resourceConfig: k8s{{ResourceName}}Config,
  resource: {{resourceName}}Draft,
});
```

## Permission Hook Template

```typescript
// hooks/index.ts
export const use{{ResourceName}}Permissions = createUsePermissionsHook(k8s{{ResourceName}}Config);

// Component Usage
const {{ComponentName}} = () => {
  const permissions = use{{ResourceName}}Permissions();

  const canCreate = permissions.data?.create.allowed;
  const canDelete = permissions.data?.delete.allowed;
  const createReason = permissions.data?.create.reason;

  if (permissions.isFetching) {
    return <LoadingSpinner />;
  }

  return (
    <ButtonWithPermission
      allowed={canCreate}
      reason={createReason}
      ButtonProps={{ onClick: handleCreate }}
    >
      Create {{ResourceName}}
    </ButtonWithPermission>
  );
};
```

## WebSocket Watch Hooks Template

```typescript
// hooks/index.ts
export const use{{ResourceName}}WatchList = createUseWatchListHook(k8s{{ResourceName}}Config);
export const use{{ResourceName}}WatchItem = createUseWatchItemHook(k8s{{ResourceName}}Config);

// Component Usage - List
const {{ResourceName}}List = () => {
  const { data: {{resourceName}}s, isLoading } = use{{ResourceName}}WatchList({
    namespace: 'default',
    labels: {
      "app.edp.epam.com/{{labelKey}}": "{{labelValue}}"
    }
  });

  return (
    <Table
      data={ {{resourceName}}s || []}
      isLoading={isLoading}
      columns={columns}
    />
  );
};

// Component Usage - Detail
const {{ResourceName}}Detail = () => {
  const { {{param}} } = useParams();
  const { data: {{resourceName}} } = use{{ResourceName}}WatchItem({
    namespace: 'default',
    name: {{param}}
  });

  if (!{{resourceName}}) return <LoadingSpinner />;

  return <div>{{{resourceName}}.metadata.name}</div>;
};
```

## Resource Draft Creation Template

```typescript
// From shared package
const {{resourceName}}Draft = create{{ResourceName}}Draft({
  name: "{{example-name}}",
  {{#each draftFields}}
  {{field}}: {{value}},
  {{/each}}
});

// Submit via CRUD mutation
create{{ResourceName}}({{resourceName}}Draft);
```

## tRPC Procedure Template

```typescript
// apps/server/src/trpc/routers/{{resourceName}}.ts
export const {{resourceName}}Router = createTRPCRouter({
  {{operationName}}: protectedProcedure
    .input(z.object({
      {{#each inputFields}}
      {{field}}: {{validation}},
      {{/each}}
    }))
    .{{method}}(async ({ input, ctx }) => {
      // Validate permissions
      await validatePermissions(ctx.user, "{{resourceName}}", "{{operation}}");

      // Implementation
      return await {{implementationFunction}}(input);
    }),
});
```
