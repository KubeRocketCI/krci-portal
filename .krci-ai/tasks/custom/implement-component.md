# Task: Implement Component

## Description

Create new reusable UI components following established patterns and architectural standards.

## Prerequisites

- [ ] **Component requirements defined**: Purpose, props, and behavior specified
- [ ] **Design approval**: UI/UX finalized with all states and variants
- [ ] **Existing patterns reviewed**: Similar components in codebase analyzed

### Reference Assets

Dependencies:

- [common-components.md](./.krci-ai/data/custom/common-components.md)
- [frontend-project-structure.md](./.krci-ai/data/custom/frontend-project-structure.md)
- [form-implementation.md](./.krci-ai/data/custom/patterns/form-implementation.md)
- [error-handling.md](./.krci-ai/data/custom/patterns/error-handling.md)
- [testing-implementation.md](./.krci-ai/data/custom/patterns/testing-implementation.md)
- [component-scaffold.md](./.krci-ai/templates/custom/component-scaffold.md)

## Implementation Checklist

### Planning & Setup

- [ ] **Review existing components**: Check `@/core/components` for similar functionality
- [ ] **Determine location**: Core reusable vs feature-specific component
- [ ] **Define interface**: TypeScript props and behavior specification

### Core Implementation

- [ ] **Create component structure**: Use component-scaffold template
- [ ] **Implement TypeScript**: Full type coverage with proper interfaces
- [ ] **Apply MUI theming**: Consistent styling with theme tokens
- [ ] **Add accessibility**: ARIA labels, keyboard navigation, screen readers

### Integration Features

- [ ] **Permission integration**: Add RBAC support for action components
- [ ] **Loading states**: Use LoadingSpinner/skeleton components
- [ ] **Error handling**: Graceful fallbacks and error boundaries
- [ ] **Empty states**: Use EmptyList for data-driven components

### Testing & Documentation

- [ ] **Unit tests**: Component tests with Vitest and Testing Library
- [ ] **Integration testing**: Real application context validation
- [ ] **Usage documentation**: API and patterns documentation

## Success Criteria

- [ ] **Component functional**: All requirements implemented correctly
- [ ] **Type safety**: Full TypeScript coverage
- [ ] **Design compliance**: Matches approved designs
- [ ] **Accessibility**: WCAG compliance
- [ ] **Testing**: Comprehensive coverage
- [ ] **Documentation**: Clear usage examples

## Best Practices

1. **Reuse existing patterns**: Check common-components.md first
2. **Follow naming conventions**: PascalCase components, camelCase utilities
3. **Include accessibility**: Always add ARIA support
4. **Use TypeScript**: Clear prop interfaces
5. **Theme integration**: MUI tokens for styling
