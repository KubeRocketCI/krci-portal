# Filter Implementation Patterns

## Overview

The application provides a sophisticated filtering system through the FilterProvider pattern, enabling complex data filtering with URL state synchronization and real-time updates. The current implementation uses TanStack Form for managing filter state.

## Architecture Principles

### FilterProvider Pattern

- **Centralized State**: Filter values managed via TanStack Form in provider context
- **URL Synchronization**: Filter state synced with URL parameters (when `syncWithUrl` is enabled)
- **Match Functions**: Declarative filtering logic per filter field
- **Real-Time**: Debounced filtering as values change (300ms default)
- **Type Safety**: Fully typed filter values and match functions

### Core Components

- `FilterProvider` - Context provider for filter state using TanStack Form
- `useFilterContext` - Hook for accessing filter state and functions
- `MatchFunctions` - Declarative filter logic definitions
- Built-in match functions - Pre-built filtering utilities

## Standard Filter Structure

Each filter implementation follows a consistent file structure:

```
components/{{EntityName}}Filter/
  constants.ts          # Filter field names, defaults, match functions
  types.ts             # TypeScript type definitions
  hooks/
    useFilter.tsx      # Custom hook wrapping useFilterContext
  index.tsx            # Filter UI component
```

## Implementation Steps

### 1. Define Filter Constants

Create filter field names, default values, and match functions:

```typescript
// constants.ts
import { MatchFunctions } from "@/core/providers/Filter";
import { EntityType } from "@my-project/shared";
import { EntityFilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const ENTITY_FILTER_NAMES = {
  SEARCH: "search",
  // Add more fields as needed
} as const;

export const entityFilterDefaultValues: EntityFilterValues = {
  [ENTITY_FILTER_NAMES.SEARCH]: "",
};

export const matchFunctions: MatchFunctions<EntityType, EntityFilterValues> = {
  [ENTITY_FILTER_NAMES.SEARCH]: createSearchMatchFunction<EntityType>(),
};
```

### 2. Define Filter Types

```typescript
// types.ts
import { ENTITY_FILTER_NAMES } from "./constants";

export type EntityFilterValues = {
  [ENTITY_FILTER_NAMES.SEARCH]: string;
};
```

### 3. Create Custom Hook

```typescript
// hooks/useFilter.tsx
import { useFilterContext } from "@/core/providers/Filter";
import { EntityType } from "@my-project/shared";
import { EntityFilterValues } from "../types";

export const useEntityFilter = () =>
  useFilterContext<EntityType, EntityFilterValues>();
```

### 4. Build Filter UI Component

```typescript
// index.tsx
import { TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { ENTITY_FILTER_NAMES } from "./constants";
import { useEntityFilter } from "./hooks/useFilter";

export const EntityFilter = () => {
  const { form, reset } = useEntityFilter();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={ENTITY_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search..." />}
        </form.Field>
      </div>

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

### 5. Wrap Page with FilterProvider

```typescript
// pages/list/page.tsx
import { FilterProvider } from "@/core/providers/Filter";
import { EntityType } from "@my-project/shared";
import { EntityFilterValues } from "./components/EntityFilter/types";
import { entityFilterDefaultValues, matchFunctions } from "./components/EntityFilter/constants";
import PageView from "./view";

export default function EntityPage() {
  return (
    <FilterProvider<EntityType, EntityFilterValues>
      defaultValues={entityFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
```

### 6. Update Route Lazy Loading

```typescript
// pages/list/route.lazy.ts
import { createLazyRoute } from "@tanstack/react-router";
import EntityPage from "./page"; // Import from page.tsx, not view.tsx

const EntityRoute = createLazyRoute("/path/to/entities")({
  component: EntityPage,
});

export default EntityRoute;
```

### 7. Integrate with Table Component

```typescript
// components/EntityList/index.tsx
import React from "react";
import { Table } from "@/core/components/Table";
import { EntityFilter } from "../EntityFilter";
import { useEntityFilter } from "../EntityFilter/hooks/useFilter";

export const EntityList = () => {
  const { filterFunction } = useEntityFilter();

  const tableSlots = React.useMemo(
    () => ({
      header: <EntityFilter />,
    }),
    []
  );

  return (
    <Table
      // ... table props
      filterFunction={filterFunction}
      slots={tableSlots}
    />
  );
};
```

## Built-in Match Functions

The framework provides several pre-built match functions in `apps/client/src/core/providers/Filter/matchFunctions.ts`:

### 1. createSearchMatchFunction

Search by name or labels with support for label-specific search.

```typescript
import { createSearchMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.SEARCH]: createSearchMatchFunction<EntityType>(),
```

**Features:**

- Searches in `metadata.name` (case-insensitive)
- Searches in all label keys
- Supports `labelKey:value` syntax for specific label search (e.g., "env:prod")
- Returns true if value is empty

**Example usage:**

- `"my-app"` → matches resources with "my-app" in name or any label key
- `"environment:production"` → matches resources with label `environment=production`

### 2. createNamespaceMatchFunction

Filter by namespace(s) for multi-namespace resources.

```typescript
import { createNamespaceMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.NAMESPACES]: createNamespaceMatchFunction<EntityType>(),
```

**Filter value type:** `string[]`  
**Usage:** Matches if item's namespace is in the provided array. Empty array returns true.

### 3. createExactMatchFunction

Filter by exact value match with support for "all" option.

```typescript
import { createExactMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.TYPE]: createExactMatchFunction<EntityType, string>(
  (item) => item.spec.type
),
```

**Features:**

- Accepts a getter function to extract the value from the item
- Returns true if filter value is empty or "all"
- Performs exact string comparison

### 4. createArrayIncludesMatchFunction

Filter by array inclusion (multi-select filtering).

```typescript
import { createArrayIncludesMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.STATUSES]: createArrayIncludesMatchFunction<EntityType>(
  (item) => item.status?.phase
),
```

**Filter value type:** `string[]`  
**Features:**

- Accepts a getter function to extract the value from the item
- Returns true if filter value is empty array
- Checks if item's value is included in the filter array

### 5. createLabelMatchFunction

Filter by specific Kubernetes label value.

```typescript
import { createLabelMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.ENVIRONMENT]: createLabelMatchFunction<EntityType>("environment"),
```

**Features:**

- Matches exact label value for the specified label key
- Returns true if filter value is empty or "all"
- Directly accesses `metadata.labels[labelKey]`

### 6. createBooleanMatchFunction

Filter by boolean conditions.

```typescript
import { createBooleanMatchFunction } from "@/core/providers/Filter";

[FILTER_NAMES.IS_ACTIVE]: createBooleanMatchFunction<EntityType>(
  (item) => item.spec.enabled
),
```

**Filter value type:** `boolean`  
**Features:**

- Accepts a getter function to extract boolean from the item
- Only filters when value is `true` (returns true if falsy)
- Useful for "show only X" type filters

## Custom Match Function Patterns

### Exact Match with "All" Option

```typescript
[FILTER_NAMES.TYPE]: (item, value) => {
  if (value === "all") return true;
  return item.spec.type === value;
},
```

### Array/Multi-Select Filtering

```typescript
[FILTER_NAMES.STATUSES]: (item, value) => {
  if (!value || value.length === 0) return true;
  return value.includes(item.status?.phase);
},
```

### Case-Insensitive String Match

```typescript
[FILTER_NAMES.NAME]: (item, value) => {
  if (!value) return true;
  return item.metadata.name.toLowerCase().includes(value.toLowerCase());
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

### Complex Status Grouping

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
[FILTER_NAMES.DATE_RANGE]: (item, value: { start?: Date; end?: Date }) => {
  if (!value.start && !value.end) return true;

  const itemDate = new Date(item.metadata.creationTimestamp);

  if (value.start && itemDate < value.start) return false;
  if (value.end && itemDate > value.end) return false;

  return true;
},
```

## Form Field Components

### TextField (Text Input)

```typescript
<form.Field name={FILTER_NAMES.SEARCH}>
  {(field) => <TextField field={field} label="Search" placeholder="Type to search..." />}
</form.Field>
```

### Select (Single Selection)

```typescript
import { Select, SelectOption } from "@/core/components/form";

const options: SelectOption[] = [
  { label: "All", value: "all" },
  { label: "Option 1", value: "value1" },
];

<form.Field name={FILTER_NAMES.TYPE}>
  {(field) => <Select field={field} label="Type" options={options} placeholder="Select type" />}
</form.Field>
```

### Autocomplete (Searchable Selection)

```typescript
import { Autocomplete } from "@/core/components/form";

<form.Field name={FILTER_NAMES.NAME}>
  {(field) => (
    <Autocomplete
      field={field}
      label="Name"
      options={options}
      placeholder="Select or type"
      multiple={false}
    />
  )}
</form.Field>
```

## FilterProvider API

### Props

- **`defaultValues`**: Initial filter values (required)
- **`matchFunctions`**: Filtering logic for each field (required)
- **`syncWithUrl`**: Enable URL parameter synchronization (optional, default: false)
- **`children`**: React children to wrap (required)

### Context Value

The `useFilterContext` hook provides:

- **`form`**: TanStack Form instance with all form methods and state
- **`filterFunction`**: Computed filter function for data filtering
- **`reset`**: Function to reset all filters to default values

## Performance Optimizations

### Efficient Filtering

- **Debounced Input**: 300ms debounce on form changes reduces re-filtering
- **Memoized Functions**: Filter function memoized to prevent re-creation
- **Lazy Evaluation**: Filters only apply when data or values change
- **URL Sync Optimization**: Skips URL updates during initialization

### Best Practices

1. **Memoize Table Slots**: Wrap filter components in `React.useMemo`
2. **Simple Match Functions**: Keep match functions pure and fast
3. **Avoid Heavy Computations**: Defer complex logic outside match functions
4. **Use Built-in Functions**: Leverage pre-built match functions for optimal performance
5. **Early Returns**: Return true early in match functions when no filtering is needed

## URL State Synchronization

When `syncWithUrl` is enabled:

- Filter values are automatically synced to URL query parameters
- URL changes update filter state (e.g., browser back/forward)
- Only non-default values are included in URL
- Uses `replace: true` to avoid cluttering browser history
- Supports deep linking with filter state

## Form State Management

### isDirty Behavior

The `form.state.isDirty` flag indicates whether any form field has been modified from its initial state. **Note**: This flag remains `true` even if you revert a field to its original value (a limitation of TanStack Form).

### Reset Functionality

The `reset()` function:

- Resets all form fields to default values
- Updates filter function immediately (no debounce)
- Clears URL parameters (if `syncWithUrl` is enabled)
- Resets the form's dirty state

## Common Use Cases

### Search-Only Filter

```typescript
// Just a search field
export const SimpleFilter = () => {
  const { form, reset } = useEntityFilter();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search..." />}
        </form.Field>
      </div>
      {form.state.isDirty && (
        <div className="mt-4">
          <Button variant="outlined" onClick={reset} size="small">Clear</Button>
        </div>
      )}
    </div>
  );
};
```

### Multi-Field Filter

```typescript
// Search + Type + Status filters
export const ComplexFilter = () => {
  const { form, reset } = useEntityFilter();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" />}
        </form.Field>
      </div>
      <div className="w-64">
        <form.Field name={FILTER_NAMES.TYPE}>
          {(field) => <Select field={field} label="Type" options={typeOptions} />}
        </form.Field>
      </div>
      <div className="w-64">
        <form.Field name={FILTER_NAMES.STATUS}>
          {(field) => <Select field={field} label="Status" options={statusOptions} />}
        </form.Field>
      </div>
      {form.state.isDirty && (
        <div className="mt-4">
          <Button variant="outlined" onClick={reset} size="small">Clear</Button>
        </div>
      )}
    </div>
  );
};
```

## Reference Implementations

See these complete examples in the codebase:

- **QuickLinkFilter**: `apps/client/src/modules/platform/configuration/modules/quicklinks/components/QuickLinkFilter/`
- **CodebaseFilter**: `apps/client/src/modules/platform/codebases/pages/list/components/CodebaseFilter/`
- **PipelineFilter**: `apps/client/src/modules/platform/pipelines/pages/list/components/PipelineFilter/`
- **TaskFilter**: `apps/client/src/modules/platform/tasks/pages/list/components/TaskFilter/`

## Template Reference

For step-by-step implementation guidance:
📄 `./.krci-ai/templates/custom/filter-patterns-scaffold.md`

## Related Documentation

- **Table Integration**: `./.krci-ai/data/custom/patterns/tables.md`
- **Form Components**: `apps/client/src/core/components/form/`
- **FilterProvider Source**: `apps/client/src/core/providers/Filter/provider.tsx`
- **Match Functions Source**: `apps/client/src/core/providers/Filter/matchFunctions.ts`
