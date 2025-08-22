# Table Column Template: {{column_name}}

## Column Configuration

```typescript
{
  id: "{{column_id}}", // Unique identifier using columnNames.{{COLUMN_CONST}}
  label: "{{column_label}}", // Display header text
  data: {
    {{#if simple_sort}}
    // Simple property path sorting
    columnSortableValuePath: "{{sort_path}}", // e.g., "metadata.name" or "status.status"
    {{/if}}
    {{#if custom_sort}}
    // Custom sorting logic
    customSortFn: (a: {{data_type}}, b: {{data_type}}) => {
      {{custom_sort_logic}}
    },
    {{/if}}
    // Cell render function
    render: ({ data, meta }) => {
      {{render_content}}
    },
  },
  cell: {
    {{#if is_fixed}}
    isFixed: true, // Prevents column from being hidden
    {{/if}}
    {{#if base_width}}
    baseWidth: {{base_width}}, // Default width percentage
    {{/if}}
    {{#if col_span}}
    colSpan: {{col_span}}, // Spans multiple columns
    {{/if}}
    {{#if custom_props}}
    props: {
      {{#each cell_props}}
      {{key}}: {{value}},
      {{/each}}
    },
    {{/if}}
    {{#if not_customizable}}
    customizable: false, // Prevents width customization
    {{/if}}
    // Sync with localStorage settings
    ...getSyncedColumnData(tableSettings, columnNames.{{COLUMN_CONST}}, {{default_width}}),
  },
}
```

## Usage Example

```typescript
import { {{entity_name}}ColumnNames } from "./constants";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";

const { loadSettings } = useTableSettings("{{table_id}}");
const tableSettings = loadSettings();

const {{column_name}}Column: TableColumn<{{data_type}}> = {
  id: {{entity_name}}ColumnNames.{{COLUMN_CONST}},
  label: "{{column_label}}",
  data: {
    columnSortableValuePath: "{{sort_path}}", // Optional: for simple sorting
    render: ({ data, meta }) => {
      // Your custom cell rendering logic here
      return (
        <div>
          {/* Cell content */}
        </div>
      );
    },
  },
  cell: {
    ...getSyncedColumnData(tableSettings, {{entity_name}}ColumnNames.{{COLUMN_CONST}}, {{default_width}}),
  },
};
```

## Column Properties Reference

### Core Properties

- **`id`**: Unique column identifier (required)
- **`label`**: Column header text or React element
- **`render`**: Function that returns cell content

### Data Properties

- **`columnSortableValuePath`**: Dot-notation path for simple property sorting
- **`customSortFn`**: Custom comparison function for complex sorting

### Cell Properties

- **`baseWidth`**: Default column width percentage
- **`width`**: Current column width (managed by settings)
- **`show`**: Column visibility (managed by settings)
- **`isFixed`**: Prevents column from being hidden by users
- **`colSpan`**: Number of columns to span
- **`props`**: Additional TableCell props
- **`customizable`**: Whether width can be customized (default: true)

### Render Function Parameters

- **`data`**: The row data object
- **`meta`**: Additional metadata including:
  - `selectionLength`: Number of selected rows

## Column Types & Examples

### Text Column

```typescript
render: ({ data }) => (
  <Typography variant="body2">
    {data.name || "N/A"}
  </Typography>
)
```

### Status Column

```typescript
render: ({ data }) => (
  <StatusIcon
    Icon={getStatusIcon(data.status)}
    color={getStatusColor(data.status)}
    Title={`Status: ${data.status}`}
  />
)
```

### Actions Column

```typescript
render: ({ data }) => (
  <SomeModuleActions
    data={data}
    actions={[]}
  />
)
```

### Link Column

```typescript
render: ({ data }) => (
  <Link to={`/details/${data.id}`}>
    {data.name}
  </Link>
)
```

### Custom Format Column

```typescript
render: ({ data }) => (
  <Box>
    <Typography variant="body2">{data.title}</Typography>
    <Typography variant="caption" color="text.secondary">
      {formatDate(data.createdAt)}
    </Typography>
  </Box>
)
```

## Best Practices

1. **Unique IDs**: Use centralized `columnNames` constants
2. **Type Safety**: Define proper TypeScript interfaces for data
3. **Performance**: Memoize complex render functions when needed
4. **Accessibility**: Provide meaningful labels and ARIA attributes
5. **Error Handling**: Handle undefined/null data gracefully
6. **Consistency**: Follow established UI patterns and Typography usage
7. **Responsive**: Set appropriate base widths for different content types
8. **Permissions**: Check permissions before rendering sensitive actions
