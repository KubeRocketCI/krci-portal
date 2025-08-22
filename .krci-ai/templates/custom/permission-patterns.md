# Permission Implementation Patterns

## Permission Hook Creation

```typescript
// hooks/index.ts
export const use{{ResourceName}}Permissions = createUsePermissionsHook(k8s{{ResourceName}}Config);
```

## ButtonWithPermission Usage

```typescript
const {{ComponentName}} = () => {
  const permissions = use{{ResourceName}}Permissions();

  return (
    <ButtonWithPermission
      allowed={permissions.data?.{{action}}.allowed}
      reason={permissions.data?.{{action}}.reason}
      ButtonProps={{
        variant: "contained",
        onClick: handle{{Action}}
      }}
    >
      {{ActionLabel}}
    </ButtonWithPermission>
  );
};
```

## Conditional Rendering Based on Permissions

```typescript
const {{ComponentName}}Actions = () => {
  const permissions = use{{ResourceName}}Permissions();

  // Hide entire section if no permission
  if (!permissions.data?.{{action}}.allowed) {
    return null;
  }

  return (
    <div>
      {/* Action content */}
    </div>
  );
};
```

## Table Actions with Permissions

```typescript
const {{ResourceName}}ActionsColumn = {
  id: "actions",
  label: "Actions",
  data: {
    render: ({ data }) => {
      const permissions = use{{ResourceName}}Permissions();

      return (
        <TableRowActions
          data={data}
          actions={[
            {
              label: "Edit",
              onClick: () => handleEdit(data),
              disabled: !permissions.data?.patch.allowed,
              tooltip: permissions.data?.patch.reason,
            },
            {
              label: "Delete",
              onClick: () => handleDelete(data),
              disabled: !permissions.data?.delete.allowed,
              tooltip: permissions.data?.delete.reason,
            },
          ]}
        />
      );
    },
  },
  cell: { isFixed: true, baseWidth: 10 },
};
```

## Bulk Operations with Selection Permissions

```typescript
const {{ResourceName}}Table = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const permissions = use{{ResourceName}}Permissions();

  const selectionConfig = {
    selected,
    isRowSelectable: (row) => permissions.data?.delete.allowed,
    renderSelectionInfo: (count) => (
      <Stack direction="row" spacing={2}>
        <Typography>{count} items selected</Typography>
        <ButtonWithPermission
          allowed={permissions.data?.delete.allowed}
          reason={permissions.data?.delete.reason}
          ButtonProps={{
            variant: "contained",
            color: "error",
            onClick: handleBulkDelete,
          }}
        >
          Delete Selected
        </ButtonWithPermission>
      </Stack>
    ),
  };

  return <Table selection={selectionConfig} />;
};
```

## Server-Side Permission Validation

```typescript
// tRPC procedure with permission check
{{action}}: protectedProcedure
  .input({{inputSchema}})
  .mutation(async ({ input, ctx }) => {
    // Validate permissions before operation
    await validatePermissions(ctx.user, "{{resourceName}}", "{{action}}");

    return await {{operationFunction}}(input);
  })
```

## Permission Loading States

```typescript
const {{ComponentName}} = () => {
  const permissions = use{{ResourceName}}Permissions();

  if (permissions.isFetching) {
    return <LoadingSpinner />;
  }

  if (permissions.error) {
    return <ErrorContent error={permissions.error} />;
  }

  return (
    <ButtonWithPermission
      allowed={permissions.data?.{{action}}.allowed}
      reason={permissions.data?.{{action}}.reason}
      ButtonProps={{ onClick: handle{{Action}} }}
    >
      {{ActionLabel}}
    </ButtonWithPermission>
  );
};
```
