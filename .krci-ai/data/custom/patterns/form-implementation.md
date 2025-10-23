# Form Implementation Patterns

## Overview

The application uses React Hook Form with Zod validation for all form implementations, with a specialized multi-step form pattern for complex resource creation workflows.

## Architecture Principles

### Multi-Step Form Architecture

- Stepper Context: Centralized step navigation and validation
- Form Provider: React Hook Form integration with TypeScript
- Step-by-Step Validation: Partial validation per form section
- Error Navigation: Automatic navigation to first error step
- State Management: Persistent form state across steps

### Core Components

- `FormProvider` - React Hook Form context wrapper
- `StepperProvider` - Step navigation context
- `FormTextField` - Standardized form field component
- `FormActions` - Step navigation and validation logic

## Implementation Patterns

### Form Structure Pattern

Every multi-step form follows this structure:

1. Form Constants - Field names and step definitions
2. Form Provider - Context wrapper with validation schema
3. Step Components - Individual form sections
4. Form Actions - Navigation and submission logic
5. Field Components - Reusable form field components

### Validation Strategy

- Schema-First: Zod schemas define validation rules
- Partial Validation: Validate only current step fields
- Error Handling: Navigate to first error on submission
- Real-Time: `onChange` mode for immediate feedback

### State Management Patterns

- Centralized State: All form data in single React Hook Form instance
- Step Persistence: Form state maintained across step navigation
- Reset Handling: Proper cleanup on form close/cancel
- Dirty State: Track unsaved changes for user warnings

## Common Use Cases

### Resource Creation Forms

- Multi-step wizards for complex K8s resources
- Integration with draft creators from shared package
- Permission validation before form submission
- Success/error handling with user feedback

### Configuration Forms

- Single-step forms for simple configurations
- Real-time validation and feedback
- Integration with settings persistence

### Filter Forms

- Search and filter controls
- Integration with FilterProvider pattern
- Real-time filtering of table data

## Best Practices

1. Schema Validation: Always use Zod schemas for type safety
2. Step Validation: Validate only relevant fields per step
3. Error Feedback: Clear error messages and navigation
4. Loading States: Show progress during form submission
5. Accessibility: Proper ARIA labels and keyboard navigation
6. Mobile Support: Responsive form layouts
7. Data Consistency: Validate against business rules
8. User Experience: Smooth step transitions and feedback

## Template Reference

For implementation scaffolds: [form-patterns-scaffold.md](./.krci-ai/templates/custom/form-patterns-scaffold.md)

## Integration Points

### With Permissions

- Validate user permissions before showing forms
- Disable form submission if user lacks permissions
- Show appropriate error messages for permission denials

### With API Layer

- Use CRUD mutation hooks for form submission
- Handle success/error states consistently
- Integrate with draft creators for resource creation

### With Navigation

- Form dialogs managed by DialogContext
- Route-based forms with proper navigation
- Deep linking support for form state
