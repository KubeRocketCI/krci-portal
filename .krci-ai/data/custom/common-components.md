# Common Components Registry

## Overview

The `@/core/components` directory contains reusable UI components organized by functionality. All components are TypeScript-based with MUI theming support.

## Navigation Components

### AppSidebar (`app-sidebar.tsx`)

Main application sidebar with hierarchical navigation.

```typescript
// Auto-generated navigation based on cluster/namespace context
// Includes: Overview, Components, CD Pipelines, Applications
```

### ClusterSwitcher (`cluster-switcher.tsx`)

Dropdown for switching between Kubernetes clusters.

```typescript
// Manages cluster selection state via useClusterStore
```

### NavUser (`nav-user.tsx`)

User profile menu with authentication actions.

### NavMain (`nav-main.tsx`)

Main navigation menu component.

## Permission & Access Control

### ButtonWithPermission

Button wrapper that handles permission validation with tooltips.

```typescript
<ButtonWithPermission
  allowed={permissions.data?.create.allowed}
  reason={permissions.data?.create.reason}
  ButtonProps={{ variant: "contained", onClick: handleCreate }}
>
  Create Resource
</ButtonWithPermission>
```

## Status & Feedback Components

### StatusIcon

Displays status with colored icons and optional spinning animation.

```typescript
<StatusIcon
  Icon={statusIcon.component}
  color={statusIcon.color}
  isSpinning={statusIcon.isSpinning}
  Title={<Typography>Status: {status}</Typography>}
/>
```

### EmptyList

Standardized empty state component with action links.

```typescript
<EmptyList
  missingItemName="codebases"
  linkText="Create your first codebase"
  beforeLinkText="Get started by"
  handleClick={() => setDialog(CREATE_CODEBASE_DIALOG)}
  isSearch={false}
/>
```

## Utility Components

### ConditionalWrapper

Conditionally wraps children with another component.

```typescript
<ConditionalWrapper
  condition={hasTooltip}
  wrapper={(children) => <Tooltip title={tooltipText}>{children}</Tooltip>}
>
  <Button>Click me</Button>
</ConditionalWrapper>
```

### CopyButton

Copy text to clipboard with visual feedback.

```typescript
<CopyButton text="kubectl get pods" size="small" />
```

### TextWithTooltip

Auto-truncates text and shows tooltip on overflow.

```typescript
<TextWithTooltip
  text={longText}
  maxLineAmount={2}
  textSX={{ fontSize: 14 }}
/>
```

## Layout Components

### Section

Standard section wrapper with title, description, and copy functionality.

```typescript
<Section
  title="Kubernetes Resources"
  titleTooltip="Manage your cluster resources"
  enableCopyTitle={true}
  description="View and manage all your Kubernetes resources"
>
  {children}
</Section>
```

### PageWrapper

Standard page container with consistent spacing.

### BorderedSection

Section with bordered container styling.

### BasicLayout

Basic layout wrapper for simple pages.

## Form & Dialog Components

### ConfirmDialog

Confirmation dialog requiring user to type "confirm".

```typescript
// Used via DialogContext
const { setDialog } = useDialogContext();
setDialog({
  component: ConfirmDialog,
  props: {
    text: "This action cannot be undone",
    actionCallback: async () => {
      await deleteResource();
    },
  },
});
```

### DeleteKubeObject

Specialized deletion dialog for Kubernetes resources.

```typescript
<DeleteKubeObject
  resourceConfig={k8sCodebaseConfig}
  resource={codebase}
  onDelete={handleDelete}
/>
```

## Table Components

### Table

Comprehensive data table with sorting, pagination, selection.

```typescript
<Table
  id="codebase-list"
  data={codebases}
  columns={columns}
  pagination={{ show: true, rowsPerPage: 10 }}
  selection={{ selected, handleSelectRow, handleSelectAll }}
  settings={{ show: true }}
/>
```

## UI Primitives (`ui/`)

### Core UI Components

- **LoadingSpinner**: Standard loading indicator
- **LoadingProgressBar**: Progress bar for operations
- **Button**: Extended MUI button with theme
- **Input**: Form input components
- **Dialog**: Modal dialog wrapper
- **Sheet**: Side panel component
- **Sidebar**: Collapsible sidebar container
- **Tooltip**: Enhanced tooltip component
- **Skeleton**: Loading skeleton screens
- **Alert**: Notification alerts
- **Checkbox**: Form checkbox component
- **DropdownMenu**: Context menu component

## Icon & Visual Components

### StatusIcon

Status indicators with color coding and animation.

### SvgIconWrapper

Wrapper for SVG icons with consistent styling.

### SvgIconFromFile

Load SVG icons from file paths.

### SvgBase64Icon

Display base64 encoded SVG icons.

### CustomIcon

Custom icon component with theme integration.

### PercentageCircleChart

Circular progress chart for percentages.

## Specialized Components

### Namespaces

Namespace selection and management.

### EditorYAML

YAML editor with syntax highlighting.

### KubeConfigPreview

Preview and edit Kubernetes configuration.

### QuickLink

Quick navigation links component.

### ResourceIconLink

Link component with resource type icons.

### Snackbar

Toast notification system.

### ActionsMenuList / ActionsInlineList

Action button containers for resource operations.

### InfoColumns

Information display in column layout.

### ResponsiveChips

Chip components that adapt to screen size.

### TooltipWithLinkList

Tooltip containing list of links.

### HorizontalScrollContainer

Horizontal scrolling container for overflow content.

### TabSection / TabPanel

Tab navigation components.

### RefPortal

Portal component for rendering outside DOM hierarchy.

### LearnMoreLink

Standardized "learn more" link component.

### ErrorContent / NotFound

Error state and 404 page components.

### NewsList

News and updates display component.

## Usage Patterns

### Form Integration

For multi-step forms and complex form workflows:
**Pattern Reference:** [form-implementation.md](./.krci-ai/data/custom/patterns/form-implementation.md)

### Filter Integration

For search and filtering capabilities:
**Pattern Reference:** [filter-implementation.md](./.krci-ai/data/custom/patterns/filter-implementation.md)

### Error Handling

For consistent error display and user feedback:
**Pattern Reference:** [error-handling.md](./.krci-ai/data/custom/patterns/error-handling.md)

### Component Import Pattern

```typescript
// Import from component directory
import { StatusIcon } from "@/core/components/StatusIcon";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { EmptyList } from "@/core/components/EmptyList";

// Import UI primitives
import { Button } from "@/core/components/ui/button";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
```

### Permission Integration

```typescript
const permissions = useCodebasePermissions();

<ButtonWithPermission
  allowed={permissions.data?.create.allowed}
  reason={permissions.data?.create.reason}
  ButtonProps={{ variant: "contained" }}
>
  Create Codebase
</ButtonWithPermission>
```

### Theme Integration

All components support MUI theme customization:

```typescript
sx={{
  color: theme.palette.primary.main,
  padding: theme.typography.pxToRem(16),
}}
```

## Best Practices

1. **Consistent Imports**: Use absolute imports with `@/core/components`
2. **Permission Checks**: Always use `ButtonWithPermission` for protected actions
3. **Empty States**: Use `EmptyList` for consistent empty state UX
4. **Status Display**: Use `StatusIcon` for all status representations
5. **Text Overflow**: Use `TextWithTooltip` for potentially long text
6. **Conditional Logic**: Use `ConditionalWrapper` for clean conditional rendering
7. **Copy Functionality**: Use `CopyButton` for copyable content
8. **Confirmation**: Use `ConfirmDialog` for destructive actions
