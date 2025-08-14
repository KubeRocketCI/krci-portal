# Kubernetes Resource Implementation Patterns

## Overview

All Kubernetes resource definitions follow a standardized structure in the shared package to ensure type safety and consistent patterns across the application.

## Architecture Principles

### Shared Package Structure

- **Centralized Definitions**: All K8s resource configs live in `shared/src/k8s/groups/`
- **Type Safety**: Full TypeScript coverage with Zod schema validation. Every k8s resource must be defined in shared package. It's type should always be infered from its schema. The schema must always be full and fit to actual kubernetes resource resource definition.
- **Consistent Patterns**: Every resource follows the same file structure
- **No Magic Strings**: All configs declared as constants in shared package

### File Organization

Each resource gets its own directory with standardized files:

- `config.ts` - Resource configuration with API group/version info
- `types.ts` - TypeScript type definitions
- `schema.ts` - Zod validation schemas
- `labels.ts` - Typed label constants (if applicable)
- `index.ts` - Centralized exports

## Implementation Requirements

### Critical Rules

1. **Always use shared package definitions** - Never hardcode resource configs
2. **Create proper schemas first** - Define Zod schemas before using types
3. **Eliminate magic strings** - Declare all constants in shared package
4. **Remove unused imports** - Don't copy-paste patterns blindly

### Resource Configuration Structure

Every K8s resource must have a configuration object that includes:

- `apiVersion` - Combined group/version (e.g., 'v2.edp.epam.com/v1')
- `kind` - Resource kind (e.g., 'Codebase')
- `group` - API group (e.g., 'v2.edp.epam.com')
- `version` - API version (e.g., 'v1')
- `singularName` - Singular resource name (e.g., 'codebase')
- `pluralName` - Plural resource name (e.g., 'codebases')
- `labels` - Optional typed label selectors

### Hook Generation Pattern

Each resource automatically gets three core hooks generated from its config:

1. **WatchList Hook** - For listing resources with real-time updates
2. **WatchItem Hook** - For individual resource watching
3. **Permissions Hook** - For RBAC validation

### Draft Creation Pattern

Resources that can be created/edited get draft creator functions that:

- Provide type-safe resource construction
- Handle metadata generation
- Support validation before submission
- Integrate with CRUD mutation hooks

## Best Practices

1. **Schema-First Design**: Always define Zod schemas before TypeScript types
2. **Consistent Naming**: Follow `k8s{ResourceName}Config` pattern
3. **Label Typing**: Use typed label selectors for better IDE support
4. **Status Handling**: Make status fields optional as they're server-managed
5. **Draft Separation**: Separate full resource types from draft types
6. **Export Strategy**: Use centralized index.ts exports for clean imports

## Template Reference

For implementation scaffolds: [k8s-resource-scaffold.md](./.krci-ai/templates/custom/k8s-resource-scaffold.md)

## Integration Points

### Client-Side Usage

- Import configs from shared package
- Generate hooks using factory functions
- Use in components with full type safety

### Server-Side Usage

- Import schemas for validation
- Use configs for API operations
- Maintain type consistency across stack

### Error Prevention

- No hardcoded API versions or resource names
- All resource interactions go through typed configs
- Validation at build time via TypeScript
- Runtime validation via Zod schemas
