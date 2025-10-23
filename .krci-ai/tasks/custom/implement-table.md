---
dependencies:
  data:
    - custom/patterns/tables.md
    - custom/patterns/filter-implementation.md
    - custom/patterns/error-handling.md
    - custom/common-components.md
    - custom/api.md
  templates:
    - custom/table-patterns.md
    - custom/table-column-scaffold.md
---

# Task: Implement Data Table

## Description

Implement comprehensive data tables with sorting, pagination, filtering, selection, and permission integration using the established Table component.

## Prerequisites

Data requirements must be defined including structure, source, and operations specifications. Column specifications should be clear with types, sorting capabilities, and display requirements documented. Permission requirements must be established with RBAC rules for table actions defined. Performance needs should be identified including pagination, filtering, and optimization requirements for large datasets.

<instructions>
Define data types by creating TypeScript interfaces for table data matching API response structures. Set up data fetching using appropriate API hooks for table data with proper query configuration. Add real-time updates through WebSocket hooks for live data when immediate updates are needed. Handle loading states with skeleton loading implementation to provide visual feedback during data fetch. Add error handling with error states and retry options for failed requests following error-handling.md patterns.

Create column constants defining column IDs and display names for consistent reference throughout table code. Implement column definitions using table-column-scaffold template for structured column configuration. Add sorting logic with simple sort functions for primitive types and custom sort functions for complex data. Handle column rendering through render functions for each column type supporting various data presentations. Set column properties including width, visibility defaults, and responsiveness behavior.

Configure pagination with appropriate page size options and navigation controls. Add sorting capabilities with column-based sorting including visual indicators for sort direction. Implement selection functionality for row selection with bulk operations support. Add filtering through filter functions for data refinement following filter-implementation.md patterns. Configure settings for column visibility and width customization with persistence. Add table actions with action buttons integrated with permission validation.

Integrate permissions by creating permission hooks using permission hook creators for resource-based authorization. Add action validation to check permissions before showing action buttons to users. Handle permission states with appropriate messages for forbidden actions. Add bulk operation permissions to validate actions for multiple selected items ensuring proper authorization.

Optimize performance by implementing memoization with React.memo for expensive render operations. Add query optimization through efficient data fetching and appropriate caching strategies. Handle large datasets with pagination and virtualization when needed for thousands of rows. Optimize re-renders to minimize unnecessary updates and improve table responsiveness.

Reference tables.md for comprehensive table implementation patterns and best practices. Use common-components.md for understanding available table components and their APIs. Apply api.md patterns for proper data fetching integration with backend services.
</instructions>

## Framework Context: Data Table Implementation

Table Component Architecture: The application uses a custom Table component built on MUI DataGrid foundation with extended functionality for sorting, pagination, filtering, selection, and settings persistence. Tables follow a column-driven configuration model where each column is defined with properties for rendering, sorting, filtering, and display control.

Column Definition Pattern: Columns are defined using a structured configuration object specifying column ID, display name, render function, sort function, filter function, and display properties. Use table-column-scaffold template for consistent column definitions. Column configurations support simple primitive data and complex nested object rendering through custom render functions.

Data Fetching Integration: Tables integrate with tRPC query hooks for data fetching with React Query providing caching and background refetching. Implement loading states with skeleton loaders during initial fetch. Handle error states with retry mechanisms and user feedback. Support real-time updates through WebSocket watch hooks when live data is required.

Sorting Implementation: Tables support client-side and server-side sorting based on dataset size. Simple sorting works with primitive types automatically. Complex sorting requires custom sort functions comparing objects appropriately. Visual sort indicators show current sort column and direction to users.

Pagination Strategy: Pagination reduces initial load time and improves performance with large datasets. Configure page size options appropriately for data type and user needs. Implement pagination controls with page navigation and size selection. Persist pagination state in component state or URL parameters for user convenience.

Selection and Bulk Operations: Row selection enables bulk operations on multiple items. Implement selection state management tracking selected row IDs. Provide select all functionality for current page or entire dataset. Integrate permission validation for bulk operations ensuring users have appropriate authorization for selected items.

Filtering System: Filters refine displayed data based on user criteria. Implement filter functions for each filterable column following filter-implementation.md patterns. Support various filter types including text search, date ranges, multi-select options, and numeric ranges. Persist filter state for consistent user experience across navigation.

Settings Persistence: Table settings including column visibility, width, and order persist in localStorage for user preferences. Implement settings state management with save and restore functionality. Provide settings reset option to return to default configuration. Ensure settings persistence respects user privacy and data regulations.

Permission Integration: Action buttons and bulk operations integrate with RBAC permission system. Use permission hooks to determine action availability for current user. Disable unavailable actions with clear visual indication and tooltip explanation. Validate permissions on both client and server for security in depth.

Performance Optimization: Large tables require optimization through memoization, virtualization, and efficient rendering. Apply React.memo to column render functions preventing unnecessary re-renders. Implement query optimization with appropriate cache times and refetch strategies. Consider virtualization for tables with hundreds or thousands of rows to maintain smooth scrolling performance.

## Implementation Checklist

### Data Setup

- Define data types: TypeScript interfaces for table data
- Set up data fetching: API hooks for table data
- Add real-time updates: WebSocket hooks for live data
- Handle loading states: Skeleton loading implementation
- Add error handling: Error states with retry options

### Column Configuration

- Create column constants: Define column IDs and names
- Implement column definitions: Use table-column-scaffold template
- Add sorting logic: Simple and custom sort functions
- Handle column rendering: Render functions for each column type
- Set column properties: Width, visibility, responsiveness

### Table Features

- Configure pagination: Page size and navigation
- Add sorting: Column-based sorting with indicators
- Implement selection: Row selection with bulk operations
- Add filtering: Filter functions for data refinement
- Configure settings: Column visibility and width customization
- Add table actions: Action buttons with permissions

### Permission Integration

- Create permission hooks: Use permission hook creators
- Add action validation: Check permissions before showing actions
- Handle permission states: Appropriate messages for forbidden actions
- Add bulk operation permissions: Validate for selected items

### Performance Optimization

- Implement memoization: React.memo for expensive renders
- Add query optimization: Efficient data fetching and caching
- Handle large datasets: Pagination and virtualization
- Optimize re-renders: Minimize unnecessary updates

## Success Criteria

<success_criteria>

- Table fully functional with all features working and proper data display
- Column configuration complete with all columns properly configured and rendering correctly
- Sorting implemented with column sorting including visual indicators and working logic
- Pagination working with page navigation and configurable sizes
- Selection functional with row selection and bulk operations support
- Permission integration complete with RBAC validation for all actions
- Performance optimized with efficient rendering handling large datasets smoothly
- Settings persistent with column preferences saved to localStorage
- Error handling comprehensive with proper error states and loading indicators
- Responsive design working correctly across different screen sizes
- Real-time updates functional if implemented with WebSocket data synchronization
- Filter functionality complete with working filters for applicable columns

</success_criteria>

## Best Practices

Follow tables.md documentation patterns for consistent table implementation across application. Prioritize performance by implementing memoization and efficient rendering techniques for large datasets. Always integrate RBAC validation to ensure proper authorization for table actions and bulk operations. Use table-column-scaffold template for creating new columns maintaining consistency in column definitions. Provide clear loading states and error feedback to users during data fetching and operations. Ensure responsive design making tables work across different screen sizes with appropriate mobile adaptations. Persist user settings in localStorage for consistent user experience across sessions. Apply filter-implementation.md patterns for consistent filtering behavior. Handle edge cases like empty states, error states, and loading states gracefully with appropriate user feedback.
