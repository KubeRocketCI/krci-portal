---
dependencies:
  data:
    - custom/api.md
    - custom/auth.md
    - custom/monorepo.md
    - custom/patterns/k8s-resource-implementation.md
    - custom/patterns/error-handling.md
    - custom/patterns/testing-implementation.md
  templates:
    - custom/api-hooks-scaffold.md
---

# Task: Implement API Integration

## Description

Implement new API endpoints with full-stack type safety using tRPC, including server procedures, client integration, real-time updates, and permission validation.

## Prerequisites

API requirements must be clearly defined including endpoints, data models, and operations specifications. Data models should be designed with Zod schemas and TypeScript interfaces specified completely. Permission requirements must be established with RBAC rules and access control defined. Real-time needs should be identified if WebSocket requirements exist for live data updates.

<instructions>
Create Zod schemas in shared package by defining validation schemas in `packages/shared/src/models` for data models. Define TypeScript types by exporting inferred types from Zod schemas for full type safety. Add resource configurations for Kubernetes resources if applicable following k8s-resource-implementation.md patterns. Create draft utilities for resource creation helpers when working with Kubernetes resources.

Implement tRPC router on server by creating router files in appropriate module directory following api.md structure and conventions. Add input validation using Zod schemas for all procedure inputs to ensure data integrity. Implement business logic with core functionality and comprehensive error handling following error-handling.md patterns. Add authentication through session validation and user context extraction using auth.md authentication patterns. Add permission checks with RBAC validation before operations execute to ensure authorized access. Add WebSocket support for real-time subscriptions if needed following established subscription patterns.

Integrate on client by updating AppRouter type export for client type safety and auto-completion. Create query hooks using React Query patterns for data fetching with proper cache configuration. Create mutation hooks for data modification with optimistic updates to improve user experience. Handle loading states properly with loading indicators and error handling. Add permission hooks for permission validation on client side using permission hook creators.

Implement real-time features when needed by creating WebSocket connections for real-time data streaming. Create watch hooks following useWatchList and useWatchItem patterns for live data updates. Add registry management to prevent duplicate watchers and memory leaks. Handle connection state properly with WebSocket lifecycle management including reconnection logic.

Apply monorepo organization by following package structure from monorepo.md. Place shared code in packages directory and feature code in appropriate application modules. Test implementation thoroughly following testing-implementation.md guidelines with unit tests for business logic and integration tests for full API flows.
</instructions>

## Framework Context: API Integration Architecture

tRPC Integration: The application uses tRPC for end-to-end type-safe APIs with automatic type inference from server to client. tRPC procedures are organized in routers within the server application at `apps/server/src/modules/{feature}/router.ts`. All API types are automatically inferred without manual type definitions, providing compile-time safety for API calls.

Monorepo Structure: The codebase follows a monorepo architecture with packages managed by pnpm workspaces. Shared code resides in `packages/shared` including Zod schemas, TypeScript types, and utility functions. Server code in `apps/server` handles API logic and authentication. Client code in `apps/client` consumes APIs through tRPC client with React Query integration.

Zod Schema Design: Data validation uses Zod schemas as the single source of truth for data models. Define schemas in `packages/shared/src/models` and export inferred TypeScript types using `z.infer<typeof schema>`. Schemas provide runtime validation on server inputs and compile-time types throughout the application.

Authentication System: Authentication uses session-based auth with Keycloak integration. Access session data in tRPC procedures through context with user information and token validation. Implement authentication checks in procedure middleware to protect endpoints. Follow auth.md patterns for session validation and user context extraction.

Permission Validation: RBAC permissions integrate with Keycloak authorization services. Check permissions on server using permission validation helpers before executing operations. Validate resource-based permissions using Kubernetes resource configurations. Always validate permissions on both client and server for security in depth.

React Query Integration: Client-side data fetching uses React Query (TanStack Query) with tRPC integration. Query hooks provide caching, background refetching, and optimistic updates. Configure cache behavior appropriately for different data types. Use mutation hooks with optimistic updates for responsive user interfaces.

WebSocket Support: Real-time features use WebSocket subscriptions for live data streaming. Implement watch patterns for list and item updates. Manage subscription lifecycle to prevent memory leaks. Handle reconnection logic for network interruptions. Use registry pattern to prevent duplicate subscriptions.

Error Handling: Implement comprehensive error handling at all API layers. Use tRPC error codes for appropriate HTTP status responses. Handle validation errors from Zod schemas with user-friendly messages. Catch and log unexpected errors while providing safe error responses to clients. Follow error-handling.md patterns for consistent error management.

## Implementation Checklist

### Shared Package Setup

- Create Zod schemas: Define validation in `packages/shared/src/models`
- Define TypeScript types: Export inferred types from schemas
- Add resource configs: Create K8s configurations if applicable
- Create draft utilities: Add resource creation helpers

### Server Implementation

- Create tRPC router: Use api-integration-patterns template
- Add input validation: Use Zod schemas for requests
- Implement business logic: Core functionality with error handling
- Add authentication: Session validation and user context
- Add permission checks: RBAC validation before operations
- Add WebSocket support: Real-time subscriptions if needed

### Client Integration

- Update AppRouter type: Export for client type safety
- Create query hooks: React Query hooks for data fetching
- Create mutation hooks: Data modification with optimistic updates
- Handle loading states: Proper loading and error handling
- Add permission hooks: Permission validation hooks

### Real-time Features (if needed)

- Implement WebSocket: Real-time data streaming
- Create watch hooks: useWatchList/useWatchItem patterns
- Add registry management: Prevent duplicate watchers
- Handle connection state: WebSocket lifecycle management

## Success Criteria

<success_criteria>

- Full-stack type safety achieved with end-to-end TypeScript coverage and no any usage
- Server procedures implemented with all tRPC endpoints including input validation
- Client integration complete with React Query hooks and optimistic updates
- Permission validation working with RBAC checks on both client and server
- Error handling comprehensive with proper error states and user feedback
- Performance optimized through query caching and efficient re-rendering patterns
- Code organization following proper monorepo structure with clear boundaries
- Testing coverage adequate with unit tests for logic and integration tests for flows
- Real-time features functional if implemented with WebSocket subscriptions working
- Authentication integrated with session validation and user context properly handled

</success_criteria>

## Best Practices

Design schemas first by defining Zod schemas before implementation to establish data contracts early. Leverage type safety through tRPC's end-to-end type inference avoiding manual type definitions. Validate permissions on both client and server for defense in depth security. Implement meaningful error handling with clear error messages and recovery paths. Apply efficient caching strategy using React Query's capabilities appropriately for different data types. Follow monorepo structure guidelines keeping shared code in packages and feature code in modules. Test thoroughly at all levels from unit tests for business logic to integration tests for complete API flows. Handle loading and error states consistently across all API integrations for good user experience.
