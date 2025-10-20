# Filter Patterns Template

## Overview

This template provides a standardized approach for implementing filters across resource list pages. Each filter follows a consistent structure with separate files for constants, types, hooks, and UI components.

## File Structure

```
components/
  {{EntityName}}Filter/
    constants.ts          # Filter names, default values, match functions
    types.ts             # TypeScript type definitions
    hooks/
      useFilter.tsx      # Custom hook for filter context
    index.tsx            # Filter UI component
```

## 1. Constants File Template

```typescript
// components/{{EntityName}}Filter/constants.ts
import { MatchFunctions } from "@/core/providers/Filter";
import { {{EntityType}} } from "@my-project/shared";
import { {{EntityName}}FilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const {{ENTITY_NAME}}_FILTER_NAMES = {
  SEARCH: "search",
  // Add more filter fields as needed
  // FIELD_NAME: "fieldName",
} as const;

export const {{entityName}}FilterDefaultValues: {{EntityName}}FilterValues = {
  [{{ENTITY_NAME}}_FILTER_NAMES.SEARCH]: "",
  // Add default values for additional fields
  // [{{ENTITY_NAME}}_FILTER_NAMES.FIELD_NAME]: "defaultValue",
};

export const matchFunctions: MatchFunctions<{{EntityType}}, {{EntityName}}FilterValues> = {
  // Search filter using built-in search match function
  [{{ENTITY_NAME}}_FILTER_NAMES.SEARCH]: createSearchMatchFunction<{{EntityType}}>(),

  // Example: Custom exact match filter
  // [{{ENTITY_NAME}}_FILTER_NAMES.STATUS]: (item, value) => {
  //   if (value === "all") return true;
  //   return item.status?.phase === value;
  // },

  // Example: Array/multi-select filter
  // [{{ENTITY_NAME}}_FILTER_NAMES.TYPES]: (item, value) => {
  //   if (!value || value.length === 0) return true;
  //   return value.includes(item.spec.type);
  // },

  // Example: Label-based filter
  // [{{ENTITY_NAME}}_FILTER_NAMES.LABEL]: (item, value) => {
  //   if (!value) return true;
  //   return item.metadata?.labels?.['labelKey'] === value;
  // },
};
```

## 2. Types File Template

```typescript
// components/{{EntityName}}Filter/types.ts
import { {{ENTITY_NAME}}_FILTER_NAMES } from "./constants";

export type {{EntityName}}FilterValues = {
  [{{ENTITY_NAME}}_FILTER_NAMES.SEARCH]: string;
  // Add types for additional filter fields
  // [{{ENTITY_NAME}}_FILTER_NAMES.FIELD_NAME]: string | string[] | boolean;
};
```

## 3. Custom Hook Template

```typescript
// components/{{EntityName}}Filter/hooks/useFilter.tsx
import { useFilterContext } from "@/core/providers/Filter";
import { {{EntityType}} } from "@my-project/shared";
import { {{EntityName}}FilterValues } from "../types";

export const use{{EntityName}}Filter = () => useFilterContext<{{EntityType}}, {{EntityName}}FilterValues>();
```

## 4. Filter UI Component Template

```typescript
// components/{{EntityName}}Filter/index.tsx
import { TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { {{ENTITY_NAME}}_FILTER_NAMES } from "./constants";
import { use{{EntityName}}Filter } from "./hooks/useFilter";

export const {{EntityName}}Filter = () => {
  const { form, reset } = use{{EntityName}}Filter();

  return (
    <div className="flex items-start gap-4">
      {/* Search Field */}
      <div className="w-64">
        <form.Field name={{{ENTITY_NAME}}_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search {{entityNamePlural}}" />}
        </form.Field>
      </div>

      {/* Example: Select/Dropdown Filter */}
      {/* <div className="w-64">
        <form.Field name={{{ENTITY_NAME}}_FILTER_NAMES.FIELD_NAME}>
          {(field) => (
            <Select
              field={field}
              label="Field Label"
              options={options}
              placeholder="Select option"
            />
          )}
        </form.Field>
      </div> */}

      {/* Example: Autocomplete Filter */}
      {/* <div className="w-64">
        <form.Field name={{{ENTITY_NAME}}_FILTER_NAMES.FIELD_NAME}>
          {(field) => (
            <Autocomplete
              field={field}
              label="Field Label"
              options={options}
              placeholder="Select or type"
            />
          )}
        </form.Field>
      </div> */}

      {/* Clear Button - Shows when form is dirty */}
      {form.state.isDirty && (
        <div className="mt-4">
          <Button variant="outlined" onClick={reset} size="small">
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};
```

## 5. Page-Level Integration Template

```typescript
// pages/list/page.tsx
import { FilterProvider } from "@/core/providers/Filter";
import { {{EntityType}} } from "@my-project/shared";
import { {{EntityName}}FilterValues } from "./components/{{EntityName}}Filter/types";
import { {{entityName}}FilterDefaultValues, matchFunctions } from "./components/{{EntityName}}Filter/constants";
import PageView from "./view";

export default function {{EntityName}}Page() {
  return (
    <FilterProvider<{{EntityType}}, {{EntityName}}FilterValues>
      defaultValues={ {{entityName}}FilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
```

## 6. Route Integration Template

```typescript
// pages/list/route.lazy.ts
import { createLazyRoute } from "@tanstack/react-router";
import {{EntityName}}Page from "./page";

const {{EntityName}}Route = createLazyRoute("/path/to/{{entityNamePlural}}")({
  component: {{EntityName}}Page,
});

export default {{EntityName}}Route;
```

## 7. List Component Integration Template

```typescript
// components/{{EntityName}}List/index.tsx
import React from "react";
import { Table } from "@/core/components/Table";
import { use{{EntityName}}WatchList } from "@/k8s/api/groups/.../{{EntityName}}";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "./hooks/useColumns";
import { {{EntityName}}Filter } from "../{{EntityName}}Filter";
import { use{{EntityName}}Filter } from "../{{EntityName}}Filter/hooks/useFilter";

export const {{EntityName}}List = () => {
  const columns = useColumns();
  const {{entityName}}Watch = use{{EntityName}}WatchList();
  const { filterFunction } = use{{EntityName}}Filter();

  const tableSlots = React.useMemo(
    () => ({
      header: <{{EntityName}}Filter />,
    }),
    []
  );

  return (
    <Table
      id={TABLE.{{ENTITY_NAME}}?.id}
      name={TABLE.{{ENTITY_NAME}}?.name}
      isLoading={!{{entityName}}Watch.query.isFetched}
      data={ {{entityName}}Watch.dataArray}
      errors={[]}
      columns={columns}
      filterFunction={filterFunction}
      slots={tableSlots}
    />
  );
};
```

## Built-in Match Functions

The framework provides several pre-built match functions in `@/core/providers/Filter`:

### 1. createSearchMatchFunction

Search by name or labels with support for label-specific search using `key:value` syntax.

```typescript
import { createSearchMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.SEARCH]: createSearchMatchFunction<EntityType>(),
```

**Features:**

- Searches in `metadata.name`
- Searches in all label keys
- Supports `labelKey:value` syntax for specific label search
- Case-insensitive

### 2. createNamespaceMatchFunction

Filter by namespace(s) for multi-namespace resources.

```typescript
import { createNamespaceMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.NAMESPACES]: createNamespaceMatchFunction<EntityType>(),
```

**Usage:** Pass array of namespace strings as filter value.

### 3. createExactMatchFunction

Filter by exact value match with support for "all" option.

```typescript
import { createExactMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.TYPE]: createExactMatchFunction<EntityType, string>(
  (item) => item.spec.type
),
```

**Features:**

- Handles "all" as a special value (returns true)
- Supports exact string matching

### 4. createArrayIncludesMatchFunction

Filter by array inclusion (multi-select filtering).

```typescript
import { createArrayIncludesMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.STATUSES]: createArrayIncludesMatchFunction<EntityType>(
  (item) => item.status?.phase
),
```

**Usage:** Pass array of allowed values as filter value.

### 5. createLabelMatchFunction

Filter by specific Kubernetes label value.

```typescript
import { createLabelMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.ENVIRONMENT]: createLabelMatchFunction<EntityType>("environment"),
```

**Features:**

- Handles "all" as a special value (returns true)
- Matches exact label value

### 6. createBooleanMatchFunction

Filter by boolean conditions.

```typescript
import { createBooleanMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.IS_ACTIVE]: createBooleanMatchFunction<EntityType>(
  (item) => item.spec.enabled
),
```

**Usage:** Pass boolean as filter value. Only filters when value is `true`.

## Custom Match Function Examples

### Complex Status Match

```typescript
[FILTER_NAMES.STATUS]: (item, value) => {
  if (value === "all") return true;

  const phase = item.status?.phase?.toLowerCase();

  // Group multiple statuses
  if (value === "active") {
    return ["running", "succeeded"].includes(phase);
  }

  return phase === value;
},
```

### Date Range Match

```typescript
[FILTER_NAMES.DATE_RANGE]: (item, value) => {
  if (!value.start && !value.end) return true;

  const itemDate = new Date(item.metadata.creationTimestamp);

  if (value.start && itemDate < value.start) return false;
  if (value.end && itemDate > value.end) return false;

  return true;
},
```

### Nested Property Match

```typescript
[FILTER_NAMES.REPOSITORY]: (item, value) => {
  if (!value) return true;

  const repoUrl = item.spec?.source?.git?.url?.toLowerCase();
  return repoUrl?.includes(value.toLowerCase()) ?? false;
},
```

## Form Field Components

### TextField (Text Input)

```typescript
<form.Field name={FILTER_NAMES.SEARCH}>
  {(field) => (
    <TextField
      field={field}
      label="Search"
      placeholder="Type to search..."
    />
  )}
</form.Field>
```

### Select (Dropdown)

```typescript
import { Select, SelectOption } from "@/core/components/form";

const options: SelectOption[] = [
  { label: "All", value: "all" },
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
];

<form.Field name={FILTER_NAMES.TYPE}>
  {(field) => (
    <Select
      field={field}
      label="Type"
      options={options}
      placeholder="Select type"
    />
  )}
</form.Field>
```

### Autocomplete (Searchable Dropdown)

```typescript
import { Autocomplete } from "@/core/components/form";

<form.Field name={FILTER_NAMES.NAME}>
  {(field) => (
    <Autocomplete
      field={field}
      label="Name"
      options={nameOptions}
      placeholder="Select or type"
      multiple={false}
    />
  )}
</form.Field>
```

## Best Practices

1. **Consistent Naming**: Use `{{ENTITY_NAME}}_FILTER_NAMES` pattern for filter field constants
2. **Type Safety**: Always define filter value types in separate types file
3. **Default Values**: Provide sensible defaults for all filter fields
4. **URL Sync**: Use `syncWithUrl` prop for shareable filter states
5. **Performance**: Use built-in match functions when possible for optimal performance
6. **User Experience**: Show clear button only when `form.state.isDirty` is true
7. **Accessibility**: Provide labels and placeholders for all inputs
8. **Layout**: Use consistent width classes (e.g., `w-64`) for filter fields
9. **Memoization**: Wrap `tableSlots` in `React.useMemo` to prevent unnecessary re-renders
10. **Documentation**: Comment complex custom match functions

## Reference Implementations

See these complete filter implementations in the codebase:

- `apps/client/src/modules/platform/codebases/pages/list/components/CodebaseFilter/`
- `apps/client/src/modules/platform/configuration/modules/quicklinks/components/QuickLinkFilter/`
- `apps/client/src/modules/platform/pipelines/pages/list/components/PipelineFilter/`
- `apps/client/src/modules/platform/tasks/pages/list/components/TaskFilter/`
