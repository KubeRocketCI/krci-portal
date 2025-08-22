# Frontend Project Structure

This project follows a domain-driven architecture approach similar to Angular's module system, but with more flexibility.

## Core Architecture Principles

- **Domain-Attached Organization**: All code is organized by domain/feature. Module-specific constants, components, and utilities must be placed within their respective modules rather than in shared/core directories.
- **Clear Separation of Concerns**: Shared code lives in `core/`, while feature-specific code lives in `modules/`.

## Root Directory Structure

```
./App.tsx               # Root application component
./main.tsx              # Application entry point
./assets/               # Static assets (images, icons, etc.)
./tailwind.css          # Tailwind CSS styles
./k8s/                  # Kubernetes module (API, resource icons, constants, configs, services)
./core/                 # Shared/common codebase
./modules/              # Feature modules
```

## Core Directory (`./core/`)

The core directory contains shared functionality used across multiple modules:

```
./core/
├── auth/                   # Authentication module
│   ├── pages/              # Auth pages (login, loginCallback)
│   └── provider/           # Auth provider (data and service methods)
├── clients/                # React Query and tRPC clients
├── components/             # Shared components across modules
│   └── ui/                 # Atomic UI components (Button, Checkbox, Alert, etc.)
├── constants/              # Shared constants
├── hooks/                  # Shared custom hooks
├── providers/              # Shared context providers (tabs, dialogs, forms, filter, viewmode)
├── router/                 # Main application router
├── services/               # Shared services (localStorage, etc.)
├── types/                  # Shared TypeScript types
└── utils/                  # Shared utility functions
```

## Modules Directory (`./modules/`)

Feature-specific modules containing domain logic:

```
./modules/
└── platform/              # Main content module
```

## Component Structure Patterns

### Standard Component Structure

```
{{ComponentName}}/
├── components/            # Nested private components
├── hooks/                 # Component-specific custom hooks
├── constants.ts           # Component-only constants
├── utils.ts               # Simple utilities (single file)
├── utils/                 # Complex utilities (folder with tests)
├── types.ts               # Component-specific types
├── styles.ts              # CSS-in-JS styles (if enabled)
├── index.tsx              # Main component markup
└── index.test.tsx         # Unit tests
```

### Page Structure

```
{{page-name}}/
├── components/            # Page-specific private components
├── hooks/                 # Page-specific custom hooks
├── constants.ts           # Page-only constants
├── page.tsx               # Page entry point (wraps content with context providers)
├── view.tsx               # Main page content (used within page.tsx)
├── view.test.tsx          # Unit tests
├── route.ts               # Route definition
└── route.lazy.ts          # Lazy route definition
```

**Page Architecture Pattern:**

- `page.tsx`: Handles context providers, layout, and page-level concerns
- `view.tsx`: Contains the actual page content and business logic
- This separation allows for cleaner testing and better separation of concerns

### Module Structure

```
{{module-name}}/
├── components/            # Module-specific shared components
├── dialogs/               # Module-specific dialog components
└── pages/                 # Module pages
```

**Dialog Implementation:**

- Dialogs are specialized components designed to work exclusively with the `useDialogContext` hook
- Must be used in conjunction with the global `DialogContextProvider`
- Follow the same component structure as standard components

## File Naming Conventions

- **Components**: Use PascalCase for directories and files (`UserProfile/`, `index.tsx`)
- **Pages**: Use kebab-case for directories (`user-profile/`, `page.tsx`)
- **Utilities**: Use camelCase (`utils.ts`, `formatDate.ts`)
- **Types**: Use camelCase with `.ts` extension (`types.ts`, `userTypes.ts`)

## Testing Strategy

- Component tests: `index.test.tsx` (co-located with components)
- Page tests: `view.test.tsx` (testing the view logic separately from page setup)
- Utility tests: Within `utils/` folders for complex utilities

## Key Guidelines

1. **Domain Boundaries**: Never place domain-specific code in the `core/` directory
2. **Component Isolation**: Each component should be self-contained with its own types, constants, and utilities
3. **Page/View Separation**: Always separate page setup from page content for better testability
4. **Shared vs. Private**: Clearly distinguish between shared components (in `core/`) and private components (within feature modules)
