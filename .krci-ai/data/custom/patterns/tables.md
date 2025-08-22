# Table Patterns and Implementation

## Overview

Application tables follow a consistent design pattern across all resource views, providing uniform user experience and functionality. The `Table` component provides comprehensive data presentation with sorting, pagination, filtering, selection, and customizable settings.

## Template Reference

For implementing tables, use the **Table Implementation Patterns**:
📄 [table-patterns.md](./.krci-ai/templates/custom/table-patterns.md)
📄 [table-column-scaffold.md](./.krci-ai/templates/custom/table-column-scaffold.md)

**Related Patterns:**

- Filter Integration: [filter-implementation.md](./.krci-ai/data/custom/patterns/filter-implementation.md)
- Permission Validation: [auth.md](./.krci-ai/data/custom/auth.md)
- Error Handling: [error-handling.md](./.krci-ai/data/custom/patterns/error-handling.md)

## Table Component Features

### Core Functionality

- **Data Display**: Structured presentation of resource data
- **Sorting**: Column-based sorting with custom and simple sort functions
- **Pagination**: Configurable page size and navigation
- **Selection**: Multi-row selection with bulk operations
- **Filtering**: Custom filter functions for data refinement
- **Settings**: Persistent column visibility and width customization
- **Loading States**: Built-in loading and error handling
- **Responsive Design**: Adaptive layout for different screen sizes

### Standard Table Structure

#### Core Components

- **Status Icon**: Visual status representation (if applicable to resource)
- **Name Field**: Primary identifier column
- **Resource Fields**: Domain-specific data columns
- **Actions Column**: Permission-protected action buttons that open related dialogs
- **Column Management**: User-customizable column visibility and width settings

#### Table Settings

Tables support persistent user preferences stored in localStorage:

```typescript
const { loadSettings } = useTableSettings(TABLE.CDPIPELINE_LIST.id);
const tableSettings = loadSettings();
```

## Column Configuration

### Column Object Structure

Each table column follows a standardized configuration pattern with these key properties:

- **`id`**: Unique column identifier (required)
- **`label`**: Column header text or React element
- **`render`**: Function that returns cell content
- **`columnSortableValuePath`**: Dot-notation path for simple property sorting
- **`customSortFn`**: Custom comparison function for complex sorting
- **`cell`**: Configuration for width, visibility, and responsiveness

### Column Properties Reference

#### Data Properties

- **`columnSortableValuePath`**: Dot-notation path for simple sorting
- **`customSortFn`**: Custom comparison function for complex sorting logic
- **`render`**: React component render function for cell content

#### Cell Properties

- **`baseWidth`**: Default column width percentage
- **`width`**: Current column width (managed by settings)
- **`show`**: Column visibility (managed by settings)
- **`isFixed`**: Prevents column from being hidden by users
- **`colSpan`**: Number of columns to span
- **`props`**: Additional TableCell props
- **`customizable`**: Whether width can be customized (default: true)

#### Render Function Parameters

- **`data`**: The row data object
- **`meta`**: Additional metadata including:
  - `selectionLength`: Number of selected rows

## Table Configuration

### Basic Table Props

```typescript
interface TableProps<DataType> {
  id: string; // Unique table identifier
  data: DataType[]; // Data array to display
  columns: TableColumn<DataType>[]; // Column definitions
  isLoading?: boolean; // Loading state
  sort?: TableSort; // Initial sort configuration
  selection?: TableSelection<DataType>; // Selection configuration
  pagination?: TablePagination; // Pagination settings
  settings?: TableSettings; // Column settings visibility
  filterFunction?: (el: DataType) => boolean; // Custom filter function
  handleRowClick?: (event, row) => void; // Row click handler
  slots?: {
    // Custom header/footer content
    header?: React.ReactElement;
    footer?: React.ReactElement;
  };
}
```

### Pagination Configuration

Pagination supports:

- **`show`**: Enable/disable pagination
- **`rowsPerPage`**: Default page size
- **`initialPage`**: Starting page
- **`reflectInURL`**: URL state synchronization

### Selection Configuration

Selection supports:

- **`selected`**: Array of selected IDs
- **`isRowSelectable`**: Selection validation function
- **`isRowSelected`**: Selection state function
- **`handleSelectAll`**: Select all handler
- **`handleSelectRow`**: Individual selection handler
- **`renderSelectionInfo`**: Selection info display component

## Hooks and Utilities

### useTableSettings Hook

Manages persistent user preferences for column visibility and width:

```typescript
const { loadSettings, saveSettings } = useTableSettings(tableId);

// Load user preferences
const settings = loadSettings(); // { columnId: { width: 150, show: true }, ... }

// Save user preferences
saveSettings({ columnId: { width: 200, show: false } });
```

### Data Filtering and Sorting

Tables support both simple and complex data manipulation:

- **Simple Sorting**: Use `columnSortableValuePath` for property-based sorting
- **Complex Sorting**: Implement `customSortFn` for advanced sorting logic
- **Filtering**: Use `filterFunction` prop for data refinement

## Error Handling and Loading States

### Loading States

- **`isLoading`**: Shows skeleton/loading indicators
- **`blockerError`**: Displays error state blocking table interaction
- **`errors`**: Shows non-blocking error messages

### Custom Components

- **`emptyListComponent`**: Custom empty state display
- **`blockerComponent`**: Custom loading/blocking overlay

## Advanced Features

### Column Synchronization

Tables automatically sync column settings with localStorage using `getSyncedColumnData()` utility:

- Returns user preferences for width and visibility
- Provides fallback to default values
- Automatically saves changes

### Performance Optimization

1. **Memoized Render Functions**: Use `React.useMemo` for complex renders
2. **Filtered Data Caching**: Built-in memoization of filtered/sorted data
3. **Pagination**: Only renders visible rows
4. **Column Virtualization**: Efficient handling of many columns

## Table Slots

### Header Slot

Custom content above the table for filters, actions, or information.

### Footer Slot

Custom content below pagination for additional information or actions.

## Column Types

### Common Column Categories

#### Status Columns

- Visual status indicators with color coding
- Support for spinning animations during loading
- Tooltips with detailed status information

#### Name/Identifier Columns

- Primary identifier display
- Often includes navigation links
- Should be marked as `isFixed` for critical identification

#### Actions Columns

- Contains action buttons (Edit, Delete, etc.)
- Must include permission checks for each action
- Should be marked as `isFixed` to prevent hiding
- Consider non-customizable width

#### Data Display Columns

- Domain-specific information display
- May include complex rendering logic
- Consider memoization for performance

## Best Practices

1. **Consistent Column IDs**: Use centralized `columnNames` constants
2. **Permission Checks**: Always protect action buttons with permission validation
3. **Responsive Design**: Set appropriate base widths for different screen sizes
4. **Accessibility**: Provide meaningful tooltips and ARIA labels
5. **Performance**: Use memoization for complex render functions
6. **User Experience**: Mark critical columns as `isFixed` to prevent accidental hiding
7. **Error Boundaries**: Implement proper error handling for render functions
8. **Type Safety**: Use TypeScript interfaces for data types
9. **Testing**: Test column configurations and table interactions
10. **Documentation**: Document custom sort functions and complex render logic
