---
dependencies:
  data:
    - custom/common-components.md
    - custom/frontend-project-structure.md
    - custom/patterns/form-implementation.md
    - custom/patterns/error-handling.md
    - custom/patterns/testing-implementation.md
  templates:
    - custom/component-scaffold.md
---

# Task: Implement Component

## Description

Create new reusable UI components following established patterns and architectural standards.

## Prerequisites

Component requirements must be clearly defined including purpose, props, and behavior specifications. Design approval should be obtained with UI/UX finalized for all states and variants. Existing patterns should be reviewed to understand similar components in the codebase before implementation.

<instructions>
Review existing components by checking the core components directory at `@/core/components` for similar functionality before creating new implementations. Examine common-components.md to understand available reusable components and their usage patterns. Determine component location by deciding between core reusable placement for widely-used elements or feature-specific directories for module-scoped components based on usage scope and reusability requirements.

Define component interface by specifying TypeScript props and behavior requirements completely. Create clear prop interfaces with proper type definitions. Document expected prop types, default values, and usage constraints.

Create component structure using the component-scaffold template as foundation. Follow established file organization patterns from frontend-project-structure.md. Implement TypeScript with full type coverage and proper interfaces throughout the component. Apply MUI theming for consistent styling using theme tokens and design system guidelines. Add accessibility features including ARIA labels, keyboard navigation support, and screen reader compatibility.

Integrate permissions by adding RBAC support for action components when authorization checks are needed. Reference common-components.md for ButtonWithPermission and permission hook patterns. Implement loading states using LoadingSpinner or skeleton components appropriately to provide user feedback during data fetching. Handle errors gracefully with fallbacks and error boundaries following error-handling.md patterns. Add empty states using EmptyList component for data-driven components when no data is available.

Apply form patterns from form-implementation.md when creating form components. Use controlled components with proper validation and error handling. Implement form state management following established patterns.

Test component thoroughly with unit tests using Vitest and Testing Library following testing-implementation.md guidelines. Write tests for component rendering, user interactions, prop variations, and edge cases. Perform integration testing in real application context to verify component behavior with actual data and dependencies. Document usage clearly with API documentation and pattern examples showing common use cases and integration approaches.
</instructions>

## Framework Context: Component Implementation Standards

Component Architecture: The application uses a component-based architecture with MUI (Material-UI) as the design system foundation. Components are organized in `@/core/components` for reusable elements shared across features and feature-specific directories like `@/modules/{feature}/components` for module-scoped components. This organization promotes code reusability while maintaining clear feature boundaries.

TypeScript Integration: All components require full type coverage with explicit prop interfaces. Define component props using TypeScript interfaces or types with clear property definitions, optional markers, and JSDoc comments for complex props. Use TypeScript's type inference where possible but always define component props explicitly for better IDE support and type safety.

MUI Design System: Components integrate with Material-UI's theming system using theme tokens for colors, spacing, typography, and breakpoints. Access theme values through the `useTheme` hook or `sx` prop for consistent styling. Follow MUI component composition patterns and leverage built-in components before creating custom implementations.

Accessibility Requirements: Components must meet WCAG 2.1 Level AA compliance standards. Implement proper ARIA attributes for screen reader support, ensure keyboard navigation functionality for all interactive elements, maintain sufficient color contrast ratios, and provide appropriate focus indicators. Test accessibility using browser DevTools and screen reader software.

Permission Integration: Action components requiring authorization should integrate with the RBAC permission system. Use permission hooks created with `createUsePermissionsHook` for resource-based permissions. Apply ButtonWithPermission component for action buttons that require permission validation. Check permissions on both client and server sides for security.

Testing Standards: Component testing follows Vitest and React Testing Library patterns. Write tests that focus on component behavior from user perspective rather than implementation details. Test rendering outputs, user interactions, prop variations, loading states, error states, and accessibility features. Aim for comprehensive test coverage while maintaining test maintainability.

## Implementation Checklist

### Planning & Setup

- Review existing components: Check `@/core/components` for similar functionality
- Determine location: Core reusable vs feature-specific component
- Define interface: TypeScript props and behavior specification

### Core Implementation

- Create component structure: Use component-scaffold template
- Implement TypeScript: Full type coverage with proper interfaces
- Apply MUI theming: Consistent styling with theme tokens
- Add accessibility: ARIA labels, keyboard navigation, screen readers

### Integration Features

- Permission integration: Add RBAC support for action components
- Loading states: Use LoadingSpinner/skeleton components
- Error handling: Graceful fallbacks and error boundaries
- Empty states: Use EmptyList for data-driven components

### Testing & Documentation

- Unit tests: Component tests with Vitest and Testing Library
- Integration testing: Real application context validation
- Usage documentation: API and patterns documentation

## Success Criteria

<success_criteria>

- Component functional with all requirements implemented correctly
- Type safety achieved with full TypeScript coverage throughout component
- Design compliance confirmed matching approved designs and MUI theme standards
- Accessibility verified with WCAG 2.1 Level AA compliance
- Testing complete with comprehensive unit and integration test coverage
- Documentation provided with clear usage examples and API reference
- Performance optimized with proper memoization and efficient rendering
- Error handling implemented with graceful fallbacks and user feedback
- Integration validated with component working correctly in application context

</success_criteria>

## Best Practices

Review common-components.md before implementation to identify existing reusable patterns and avoid duplication. Follow established naming conventions using PascalCase for component names and camelCase for utility functions and hooks. Always include accessibility features with proper ARIA attributes and keyboard navigation support. Use TypeScript with clear prop interfaces and comprehensive type definitions. Integrate with MUI theming system using theme tokens for consistent styling across the application. Apply error boundaries and loading states for robust user experience. Test components thoroughly from user perspective using Testing Library patterns.
