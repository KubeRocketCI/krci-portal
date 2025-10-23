# Testing Implementation Patterns

## Overview

The application uses Vitest as the primary testing framework with React Testing Library for component testing and comprehensive patterns for testing different layers of the application.

## Architecture Principles

### Testing Strategy

- Unit Testing: Individual component and utility testing
- Integration Testing: Component integration and API testing
- E2E Testing: Full application workflow testing
- Accessibility Testing: Screen reader and keyboard navigation
- Performance Testing: Load time and rendering performance

### Testing Tools

- Vitest: Fast unit test runner with ESM support
- React Testing Library: Component testing with user-centric queries
- MSW: API mocking for integration tests
- Testing Library User Event: User interaction simulation
- Axe: Accessibility testing automation

## Implementation Patterns

### Component Testing Pattern

Standard pattern for testing React components:

1. Setup: Render component with required providers
2. Interaction: Simulate user interactions
3. Assertion: Verify expected behavior and output
4. Cleanup: Clean up after tests

### Hook Testing Pattern

Testing custom hooks in isolation:

- renderHook: Test hook behavior without components
- Provider Wrapping: Include necessary context providers
- State Updates: Test hook state changes over time
- Error Scenarios: Test hook error handling

### API Testing Pattern

Testing API integration and data flow:

- Mock Responses: Use MSW for realistic API mocking
- Error Simulation: Test error handling scenarios
- Loading States: Verify loading behavior
- Cache Testing: Test React Query cache behavior

## Common Testing Scenarios

### Table Component Testing

- Data Display: Verify correct data rendering
- Sorting: Test column sorting functionality
- Filtering: Test filter application and results
- Selection: Test row selection behavior
- Pagination: Test page navigation and sizing
- Actions: Test action button functionality

### Form Testing

- Field Validation: Test individual field validation
- Form Submission: Test successful submission flow
- Error Handling: Test validation error display
- Step Navigation: Test multi-step form navigation
- Reset Behavior: Test form reset and cleanup

### Permission Testing

- Access Control: Test permission-based UI rendering
- Button States: Test button enable/disable based on permissions
- Error Messages: Test permission denial feedback
- Loading States: Test permission loading behavior

### Navigation Testing

- Route Navigation: Test route transitions and parameters
- Authentication: Test protected route behavior
- Error Pages: Test 404 and error page rendering
- Deep Links: Test direct URL navigation

## Mock Patterns

### API Mocking

```typescript
// Mock server setup for API testing
export const server = setupServer(
  rest.get("/api/codebases", (req, res, ctx) => {
    return res(ctx.json(mockCodebases));
  }),
  rest.post("/api/codebases", (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);
```

### Context Mocking

```typescript
// Mock context providers for isolated testing
const MockProviders = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    <AuthProvider value={mockAuthContext}>
      {children}
    </AuthProvider>
  </QueryClientProvider>
);
```

### Hook Mocking

```typescript
// Mock custom hooks for component testing
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    data: { create: { allowed: true, reason: "" } },
    isLoading: false,
  }),
}));
```

## Test Organization

### File Structure

- Component Tests: Co-located with components (`component.test.tsx`)
- Hook Tests: In hook directories (`hook.test.ts`)
- Utility Tests: In utility directories (`utility.test.ts`)
- Integration Tests: In dedicated test directories

### Test Naming

- Descriptive Names: Clear test descriptions
- User Perspective: Test from user's point of view
- Behavior Focus: Test behavior, not implementation
- Error Scenarios: Include error case testing

## Best Practices

1. User-Centric Testing: Test from user perspective, not implementation
2. Accessibility: Include accessibility testing in component tests
3. Performance: Test performance-critical paths
4. Error Scenarios: Always test error conditions
5. Mock Strategy: Mock external dependencies, not internal logic
6. Test Independence: Each test should be independent
7. Fast Feedback: Optimize for fast test execution
8. Coverage Goals: Maintain meaningful test coverage

## Common Test Utilities

### Custom Render Functions

```typescript
// Custom render with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  return render(ui, {
    wrapper: AllProviders,
    ...options,
  });
};
```

### Test Data Factories

```typescript
// Factory functions for test data
export const createMockCodebase = (overrides = {}) => ({
  metadata: { name: "test-codebase", namespace: "default" },
  spec: { gitUrl: "https://github.com/test/repo" },
  ...overrides,
});
```

### Assertion Helpers

```typescript
// Custom assertions for common scenarios
export const expectToBeVisible = (element: HTMLElement) => {
  expect(element).toBeVisible();
  expect(element).not.toHaveAttribute("aria-hidden", "true");
};
```

## Integration Points

### With CI/CD

- Automated Testing: Run tests on every commit
- Coverage Reporting: Track test coverage metrics
- Performance Benchmarks: Monitor test performance
- Accessibility Checks: Automated accessibility testing

### With Development Workflow

- Watch Mode: Continuous testing during development
- Debug Support: Easy test debugging capabilities
- Hot Reload: Fast test re-execution
- IDE Integration: Editor support for testing
