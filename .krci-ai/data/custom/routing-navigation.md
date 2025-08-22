# Routing and Navigation

## Overview

The application uses **Tanstack Router** for client-side routing, implementing a hierarchical route structure with authentication guards, layout components, and Kubernetes-specific navigation patterns.

## Router Architecture

### Route Hierarchy

The routing system follows a prototype-styled inheritance pattern with clear separation of concerns:

```
rootRoute
├── authRoute
│   ├── /login
│   └── /login-callback
└── contentLayoutRoute
    └── routeCluster
        ├── /clusters/{clusterName}
        ├── /clusters/{clusterName}/namespaces/{namespace}
        └── /clusters/{clusterName}/namespaces/{namespace}/{resourceType}/{name}
```

### Core Route Types

#### 1. Root Route (`rootRoute`)

- **Purpose**: Main base route inherited by all other route groups
- **Responsibilities**:
  - Authentication state validation
  - Route access control decisions
  - Redirect logic to auth routes when unauthorized
  - Global error boundary handling

#### 2. Auth Route (`authRoute`)

- **Purpose**: Handles authentication flow
- **Child Routes**:
  - `/login` - User authentication initiation
  - `/login-callback` - OAuth callback handling
- **Behavior**: Accessible only when user is not authenticated

#### 3. Content Layout Route (`contentLayoutRoute`)

- **Purpose**: Provides base UI/UX for authenticated content pages
- **Layout Features**:
  - Application header with user controls
  - Collapsible sidebar navigation
  - Expandable content area (flex-grow to viewport height)
  - Global loading and error states

#### 4. Cluster Route (`routeCluster`)

- **Purpose**: Kubernetes-specific navigation and parameter handling
- **Inheritance**: Extends `contentLayoutRoute`
- **URL Parameters**:
  - `clusterName` - Target Kubernetes cluster
  - `namespace` - Kubernetes namespace
  - `name` - Resource name (matches `resource.metadata.name`)

## File Structure

### Router Configuration

```
@/core/router/
├── index.ts              # Main router definition and route registry
├── routes/
│   ├── root.ts          # Root route configuration
│   ├── auth.ts          # Authentication routes
│   ├── layout.ts        # Content layout route
│   └── cluster.ts       # Kubernetes cluster routes
```

### Module Route Definitions

Each feature module defines its own routes:

```
@/modules/{module-name}/pages/
├── {page-name}/
│   ├── route.ts         # Route definition and configuration
│   ├── route.lazy.ts    # Lazy-loaded route component
│   ├── page.tsx         # Page wrapper with providers
│   └── view.tsx         # Main page content
```

## Navigation Components

### Sidebar Navigation

- **Location**: `@/core/components/app-sidebar.tsx`
- **Purpose**: Primary navigation for application modules
- **Behavior**:
  - Shows only list/index pages as navigation items
  - Module detail pages accessible via list navigation
  - Collapsible design for responsive layouts

## Route Configuration Patterns

### Standard Route Definition

```typescript
// route.ts
export const exampleRoute = createRoute({
  getParentRoute: () => clusterRoute,
  path: "/example",
  component: ExamplePage,
  beforeLoad: ({ context }) => {
    // Permission checks, data validation
  },
});
```

### Lazy Route Loading

```typescript
// route.lazy.ts
export const exampleRouteLazy = createLazyRoute("/example")({
  component: () => import("./page").then((m) => m.ExamplePage),
});
```

### Protected Routes

- All routes under `contentLayoutRoute` require authentication
- Automatic redirect to `/auth/login` for unauthenticated users
- Session validation on route transitions

## Navigation Patterns

### List → Details Flow

Most application pages follow a list → details navigation pattern:

- **List Pages**: Show resource overview with short info and actions button
- **Details Pages**: Full resource information with tabbed sections using `useTabs` hooks
- **Tab Organization**: Each tab is a separate component for modularity

### Module Navigation Structure

- **List Pages**: Primary navigation entries in sidebar
- **Detail Pages**: Accessible through list interactions
- **Create/Edit**: Modal dialogs or dedicated routes
- **Nested Resources**: Follow cluster/namespace/resource hierarchy

### URL Parameter Flow

```
/clusters/dev-cluster/namespaces/default/codebases/my-app
│        │           │          │         │         │
│        │           │          │         │         └─ Resource name
│        │           │          │         └─ Resource type
│        │           │          └─ Namespace
│        │           └─ Kubernetes namespace prefix
│        └─ Cluster name
└─ Application base
```

## Best Practices

1. **Route Organization**: Keep route definitions close to their components
2. **Lazy Loading**: Use lazy routes for code splitting and performance
3. **Parameter Validation**: Validate route parameters in `beforeLoad`
4. **Error Boundaries**: Implement route-level error handling
5. **Type Safety**: Leverage Tanstack Router's TypeScript integration
6. **Navigation State**: Use router state for navigation UI feedback
7. **Deep Linking**: Ensure all application states are URL-addressable
8. **Permission Checks**: Validate route access permissions before rendering

## Router Registry

### Route Registration

```typescript
// @/core/router/index.ts
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    authRoute.addChildren([loginRoute, callbackRoute]),
    contentLayoutRoute.addChildren([
      clusterRoute.addChildren([
        // Module routes registered here
        codebasesRoute,
        pipelinesRoute,
        // ...
      ]),
    ]),
  ]),
});
```

### Module Route Integration

Modules export their routes for registration in the main router:

```typescript
// Module exports
export { codebaseListRoute, codebaseDetailRoute } from "./pages/list/route";
export { codebaseCreateRoute } from "./pages/create/route";
```
