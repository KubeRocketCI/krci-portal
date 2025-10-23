---
dependencies:
  data:
    - custom/routing-navigation.md
    - custom/auth.md
    - custom/frontend-project-structure.md
  templates:
    - custom/route-patterns.md
---

# Task: Implement Route

## Description

Add new routes using Tanstack Router with proper hierarchy, authentication, navigation integration, and parameter handling.

## Prerequisites

Route requirements must be defined including URL structure, parameters, and navigation flow specifications. Authentication needs should be clear with permission requirements and access control defined. Parent route must be identified with correct route hierarchy determined within application structure. Navigation integration requirements should be clear including sidebar and menu placement needs.

<instructions>
Define URL structure by planning route path with parameter placeholders for dynamic segments. Identify parent route by determining appropriate hierarchy level such as auth for public routes, contentLayout for authenticated pages, or cluster for cluster-scoped views following routing-navigation.md patterns. Define parameters by specifying required and optional route parameters with proper types. Plan navigation by determining sidebar or menu integration needs for route discoverability.

Create page directory following the page-name directory structure convention in appropriate module location per frontend-project-structure.md. Create route definition by adding route.ts file with route configuration including path, parent reference, and validation logic. Create lazy route by adding route.lazy.ts for code splitting reducing initial bundle size. Create page component by adding page.tsx wrapper with necessary providers and context setup. Create view component by adding view.tsx with main content implementation separating concerns. Add route tests by creating view.test.tsx for testing route functionality and component integration.

Define route configuration using route-patterns template for consistent route structure. Add parameter validation by validating route parameters with Zod schemas ensuring type safety. Add authentication checks by implementing beforeLoad protection for routes requiring authentication using auth.md patterns. Add data loading by implementing loader functions for route-specific data prefetching. Handle error states through error boundaries and fallback components providing good user experience.

Update sidebar navigation by adding navigation item to sidebar configuration if route should appear in main navigation. Update navigation types by adding route to TypeScript type definitions for type-safe navigation. Test navigation flow by ensuring proper navigation between routes with parameter passing. Add breadcrumbs by implementing breadcrumb navigation for hierarchical route relationships.

Export route files by exporting routes from module index for proper module organization. Register in router by adding route to main router configuration integrating with route tree. Update route tree structure ensuring proper parent-child relationships. Test route resolution by validating route matching and navigation functionality across application.
</instructions>

## Framework Context: Routing Architecture

Tanstack Router Integration: The application uses Tanstack Router (formerly React Location) for type-safe routing with excellent TypeScript integration. Routes are file-based with explicit parent-child relationships defined through route configuration. Router provides automatic code splitting, type-safe navigation, and parameter validation out of the box.

Route Hierarchy: Routes follow a hierarchical structure with layout routes defining shared UI wrappers. Root layout provides basic application shell. Auth layout handles public authentication pages. ContentLayout provides authenticated page wrapper with navigation and user context. Cluster layout adds cluster-scoped context for Kubernetes cluster pages. Choose appropriate parent for route based on authentication and context requirements.

File-Based Organization: Routes organize in feature directories with consistent file structure. Each route has directory containing route.ts for configuration, route.lazy.ts for lazy-loaded component, page.tsx for page wrapper, view.tsx for main content, and view.test.tsx for tests. This organization separates concerns and enables code splitting at route level.

Authentication Integration: Route protection integrates with authentication system through beforeLoad hooks checking session validity and user permissions. Protected routes redirect to login when session invalid. Permission-based routes validate authorization before allowing access. Use auth.md patterns for implementing authentication checks consistently.

Parameter Handling: Route parameters support dynamic segments in URLs with type-safe access in components. Define parameter schemas using Zod for runtime validation. Access validated parameters through route context with full TypeScript types. Support optional parameters and query strings for flexible routing needs.

Code Splitting: Lazy routes enable automatic code splitting reducing initial bundle size. Each route loads independently when accessed improving application load performance. Use route.lazy.ts pattern consistently for all routes enabling effective code splitting strategy.

Navigation Integration: Routes integrate with sidebar navigation and breadcrumb systems for intuitive user experience. Register routes in navigation configuration for sidebar appearance. Implement breadcrumb providers for hierarchical navigation display. Use type-safe navigation helpers for programmatic route changes.

Data Loading: Route loaders prefetch data before route renders improving perceived performance. Implement loader functions fetching required data with proper error handling. Loaders run during navigation providing data availability at render time. Cache loader results appropriately for efficient data management.

Error Handling: Routes implement error boundaries catching rendering errors and providing fallback UI. Handle loader errors gracefully showing appropriate error messages. Implement not found handling for invalid routes. Provide consistent error experience across all route error scenarios.

## Implementation Checklist

### Route Planning

- Define URL structure: Plan route path with parameters
- Identify parent route: Determine hierarchy (auth, contentLayout, cluster)
- Define parameters: Specify required and optional parameters
- Plan navigation: Determine sidebar/menu integration needs

### File Structure Setup

- Create page directory: Follow `{page-name}/` structure
- Create route definition: Add `route.ts` with configuration
- Create lazy route: Add `route.lazy.ts` for code splitting
- Create page component: Add `page.tsx` wrapper with providers
- Create view component: Add `view.tsx` with main content
- Add route tests: Create `view.test.tsx` for testing

### Route Implementation

- Define route configuration: Use route-patterns template
- Add parameter validation: Validate parameters with Zod
- Add authentication checks: Implement beforeLoad protection
- Add data loading: Implement loader for route-specific data
- Handle error states: Error boundaries and fallback components

### Navigation Integration

- Update sidebar: Add navigation item if needed
- Update navigation types: Add route to type definitions
- Test navigation flow: Ensure proper navigation between routes
- Add breadcrumbs: Implement breadcrumb navigation

### Route Registration

- Export route files: Export routes from module index
- Register in router: Add route to main router configuration
- Update route tree: Ensure proper hierarchy
- Test route resolution: Validate matching and navigation

## Success Criteria

<success_criteria>

- Route accessible and loads correctly with proper URL structure
- Parameter handling working with parameters validated and passed correctly
- Authentication functional with route protection and permission checks working
- Navigation integrated with route appearing in navigation menu if required
- Code splitting implemented with lazy loading reducing bundle size
- Error handling comprehensive with proper error boundaries and fallback states
- Type safety complete with full TypeScript coverage including parameter types
- Testing complete with route navigation and component rendering tested
- Performance optimized with efficient loading and minimal bundle size
- Accessibility verified with keyboard navigation and screen reader support
- Data loading functional with loaders prefetching required data before render
- Breadcrumbs working if applicable showing proper route hierarchy

</success_criteria>

## Best Practices

Follow correct route hierarchy using appropriate parent routes for layout and context inheritance. Implement lazy loading consistently through route.lazy.ts pattern for effective code splitting and performance. Validate route parameters with Zod schemas ensuring type safety and runtime validation. Always implement proper route protection with authentication checks for secured routes. Handle route errors gracefully through error boundaries providing good user experience. Use TypeScript throughout route definitions and parameter handling for compile-time safety. Follow established navigation patterns maintaining consistency across application routing. Test route navigation and component integration thoroughly including parameter passing and error scenarios. Organize route files following frontend-project-structure.md conventions for maintainability. Integrate with sidebar and breadcrumb systems appropriately for intuitive navigation experience.
