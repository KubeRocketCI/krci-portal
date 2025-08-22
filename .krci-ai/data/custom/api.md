# API Communication Architecture

## Overview

The application implements a modern, type-safe communication architecture using tRPC for client-server communication and specialized patterns for real-time Kubernetes resource management.

## Communication Stack

### Client ↔ Server Communication

- **Protocol**: tRPC (TypeScript Remote Procedure Call)
- **Transport**: HTTP fetch and WebSocket connections
- **Security**: HTTP-only cookie with sessionId authentication
- **Data Management**: React Query for consistent caching and state management

### Server ↔ Kubernetes Communication

- **Authentication**: Keycloak ID tokens for cluster access
- **Operations**: Full CRUD operations on Kubernetes resources
- **Real-time**: WebSocket connections for resource watching

## Session Management

### Session Architecture

- **Storage**: SQLite database (`sessions.sqlite`)
- **Data**: ID tokens, access tokens, refresh tokens, user data
- **Security**: Server-side token storage, client only receives sessionId

### Session Flow

```typescript
// Client sends sessionId cookie with every request
// Server validates sessionId and retrieves session data
// Server uses stored tokens for authenticated operations
```

## Real-time Resource Management

### WebSocket-based Kubernetes Resource Watching

#### useWatchList & useWatchItem Hooks

Real-time WebSocket-based resource watching with intelligent caching and performance optimization.

**useWatchList Behavior:**

1. Initial static data request for resource list
2. Extracts `resourceVersion` from response metadata
3. Establishes WebSocket connection from that timestamp
4. Receives real-time updates for resource changes

**useWatchItem Behavior:**

- Individual resource watching with similar WebSocket pattern
- Leverages cached data from `useWatchList` for `initialData`
- Optimizes list→detail navigation patterns

**Hook Creation Pattern:**
Generated hooks per resource type using `createUseWatchListHook` and `createUseWatchItemHook` with K8s resource configurations.

**Template Reference:** [api-hooks-scaffold.md](./.krci-ai/templates/custom/api-hooks-scaffold.md)

### Performance Optimization

#### Watcher Registries

- Located in `@/k8s/api/utils`
- Prevents duplicate WebSocket connections
- Manages resource subscription lifecycle
- Enables efficient resource sharing across components

## CRUD Operations

### useResourceCRUDMutation Hook

Standardized mutation hook for Kubernetes resource operations with automatic error handling and user feedback.

**Architecture:**

- Resource-agnostic mutation handling
- Automatic success/error messaging via snackbar
- Integration with React Query for cache invalidation
- Type-safe operation definitions

**Template Reference:** [api-hooks-scaffold.md](./.krci-ai/templates/custom/api-hooks-scaffold.md)

**Related Patterns:**

- Error Handling: [error-handling.md](./.krci-ai/data/custom/patterns/error-handling.md)
- Permission System: [auth.md](./.krci-ai/data/custom/auth.md)
- K8s Resources: [k8s-resource-implementation.md](./.krci-ai/data/custom/patterns/k8s-resource-implementation.md)

### Specialized CRUD Hooks

Each resource type provides pre-configured CRUD operations through dedicated hooks generated from the base mutation hook.

## Resource Creation Pattern

### Draft Utilities

All Kubernetes resource creation follows a standardized pattern using draft creators from the shared package. Draft utilities provide type-safe resource construction with validation.

**Architecture:**

- Centralized draft creation functions in shared package
- Type-safe resource construction
- Consistent validation across client and server
- Integration with CRUD mutations for submission

**Template Reference:** [api-hooks-scaffold.md](./.krci-ai/templates/custom/api-hooks-scaffold.md)

## Permission System

### Permission System with Hook Creators

#### createUsePermissionsHook

Hook creator pattern that generates resource-specific permission hooks from K8s resource configurations.

**Architecture:**

- RBAC integration with Keycloak groups
- Real-time permission updates via React Query
- Consistent permission object structure across all resources
- Loading states and error handling

**Permission Object Structure:**
Each permission hook returns data with `allowed` boolean and `reason` string for each operation (create, patch, delete).

**Requirements:**

- All CREATE/EDIT/DELETE operations must include permission checks
- Check `allowed` before showing UI controls
- Display `reason` for disabled actions
- Validate permissions before executing operations

**Template Reference:** [api-hooks-scaffold.md](./.krci-ai/templates/custom/api-hooks-scaffold.md)

## Resource Configuration

### K8s Resource Configs

Each Kubernetes resource type has a standardized configuration:

```typescript
interface K8sResourceConfig<Labels extends ResourceLabels = ResourceLabels> {
  apiVersion: string; // Combined group/version (e.g., 'v2.edp.epam.com/v1')
  kind: string; // Resource kind (e.g., 'Codebase')
  group: string; // API group (e.g., 'v2.edp.epam.com')
  version: string; // API version (e.g., 'v1')
  singularName: string; // Singular resource name (e.g., 'codebase')
  pluralName: string; // Plural resource name (e.g., 'codebases')
  labels?: Labels; // Optional typed labels
}

// Example resource config
const k8sCodebaseConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Codebase",
  group: "v2.edp.epam.com",
  version: "v1",
  singularName: "codebase",
  pluralName: "codebases",
  labels: codebaseLabels, // Optional typed labels
} as const satisfies K8sResourceConfig<typeof codebaseLabels>;
```

### Hook Generation

Specialized hooks are generated for each resource using factory functions and K8s resource configurations. This ensures type safety and consistent patterns across all resource types.

**Pattern:** Each resource gets three core hooks: WatchList, WatchItem, and Permissions.

**Template Reference:** [api-hooks-scaffold.md](./.krci-ai/templates/custom/api-hooks-scaffold.md)

## Non-WebSocket Operations

### Standard tRPC Procedures

For non-real-time operations (authentication, system status, configuration), use standard tRPC router procedures with React Query integration.

**Template Reference:** [api-hooks-scaffold.md](./.krci-ai/templates/custom/api-hooks-scaffold.md)

## Best Practices

1. **Consistent Caching**: Always use React Query for data management
2. **Permission Checks**: Validate permissions before any CRUD operation
3. **Resource Drafts**: Use standardized draft creators for resource creation
4. **WebSocket Efficiency**: Leverage watcher registries to prevent duplicate connections
5. **Error Handling**: Implement proper error boundaries for API operations
6. **Type Safety**: Leverage tRPC's end-to-end type safety
7. **Session Management**: Handle session expiration gracefully
8. **Real-time Updates**: Use WebSocket hooks for Kubernetes resources, tRPC for other data. PREFER websocket for real-time data updates.
