# Frontend Project Structure

This project follows a domain-driven architecture approach similar to Angular's module system, but with more flexibility.

## Core Architecture Principles

- Domain-Attached Organization: All code is organized by domain/feature. Module-specific constants, components, and utilities must be placed within their respective modules rather than in shared/core directories.
- Clear Separation of Concerns: Infrastructure code lives in `core/` and `k8s/`, while feature-specific code lives in `modules/`.
- Layered Module System: The application has three distinct module layers with different purposes (see Module Layers section below).

## Root Directory Structure

```
./App.tsx               # Root application component
./main.tsx              # Application entry point
./assets/               # Static assets (images, icons, etc.)
./tailwind.css          # Tailwind CSS styles
./k8s/                  # Kubernetes infrastructure module (API layer, resource abstractions)
./core/                 # Application infrastructure module (auth, routing, shared UI)
./modules/              # Feature modules (user-facing features organized by domain)
```

## Module Layers

The application uses a three-layer module architecture where each layer has a distinct purpose:

### Layer 1: Core Module (`./core/`)

Purpose: Application-level infrastructure that is domain-agnostic.

Contains foundational functionality that any application might need regardless of business domain:

- Authentication and authorization infrastructure
- Routing configuration
- Generic UI components (buttons, inputs, tables, dialogs)
- Application-wide providers and context
- Generic utilities and services

Rule: Never place domain-specific business logic in `core/`. If code references specific business entities (pipelines, codebases, etc.), it belongs in a feature module.

### Layer 2: K8s Module (`./k8s/`)

Purpose: Kubernetes API infrastructure and low-level resource abstractions.

Contains Kubernetes-specific infrastructure for interacting with the cluster:

- K8s API group definitions and configurations
- CRUD hooks for K8s resources (`useWatch`, `useBasicCRUD`)
- Permission hooks for K8s RBAC
- Resource type definitions and constants
- External service integrations (link creation, etc.)

Rule: The `k8s/` module should contain only data-layer code (API clients, hooks, types). High-level UI components that consume K8s data belong in feature modules, not here.

### Layer 3: Feature Modules (`./modules/`)

Purpose: User-facing features organized by business domain.

Contains all feature-specific code that users interact with:

- Pages and views
- Feature-specific components
- Domain-specific business logic
- Feature-scoped hooks and utilities

Rule: Feature modules can import from `core/` and `k8s/`, but should never be imported by them. Cross-module imports are allowed when one module needs to reuse components or hooks from another (e.g., `observability` importing from `tekton`).

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

Feature modules are organized by business domain. Each module contains all code related to a specific feature area, including components, dialogs, pages, hooks, and utilities.

```
./modules/
└── platform/                    # Main platform features
    ├── home/                    # Home/dashboard feature
    ├── marketplace/             # Marketplace feature
    ├── overview/                # Overview feature
    ├── security/                # Security scanning feature
    ├── observability/           # Observability and metrics feature
    ├── codebases/               # Codebases + CodebaseBranches feature
    ├── cdpipelines/             # CDPipelines + Stages feature
    ├── tekton/                  # Pipelines + PipelineRuns feature
    ├── tasks/                   # Tasks feature
    └── configuration/           # Configuration feature (with submodules)
        ├── components/          # Shared configuration components
        └── modules/             # Configuration submodules (argocd, clusters, etc.)
```

### Related Entities Pattern

When multiple entities are closely related and share significant code, they belong in a single module rather than separate modules. This keeps related code together and simplifies sharing.

Examples of related entities in single modules:

| Module | Related Entities | Rationale |
| ------ | ---------------- | --------- |
| `codebases/` | Codebase + CodebaseBranch | Branches belong to codebases |
| `cdpipelines/` | CDPipeline + Stage | Stages belong to pipelines |
| `tekton/` | Pipeline + PipelineRun | Runs are executions of pipelines |

Module structure with related entities:

```text
{{module-name}}/
├── components/
│   ├── {{EntityA}}ActionsMenu/
│   ├── {{EntityA}}Diagram/
│   ├── {{EntityB}}ActionsMenu/
│   ├── {{EntityB}}List/
│   └── SharedComponent/           # Shared across both entities
├── dialogs/
│   ├── {{EntityA}}Dialog/
│   └── {{EntityB}}Dialog/
├── hooks/                         # Shared hooks for the module
│   ├── useEntityAData/
│   └── useEntityBData/
├── pages/
│   ├── entity-a-list/
│   ├── entity-a-details/
│   ├── entity-b-list/
│   └── entity-b-details/
└── utils/                         # Shared utilities for the module
```

### Example: Tekton Module

The `tekton` module combines Pipeline and PipelineRun management with shared Tekton Results functionality:

```text
tekton/
├── components/
│   ├── Pipeline/                  # Pipeline display component
│   ├── PipelineActionsMenu/       # Pipeline actions
│   ├── PipelineDiagram/           # Pipeline visualization
│   ├── PipelineRunActionsMenu/    # PipelineRun actions
│   ├── PipelineRunDiagram/        # PipelineRun visualization
│   ├── PipelineRunList/           # PipelineRun list component
│   └── TektonResultsTable/        # Shared results table (from Tekton Results API)
│       ├── components/
│       │   └── TektonResultsFilter/
│       ├── hooks/
│       │   ├── useColumns.tsx
│       │   └── useFilteredResults.ts
│       ├── constants.ts
│       ├── types.ts
│       └── index.tsx
├── dialogs/
│   ├── PipelineGraph/             # Pipeline graph dialog
│   └── PipelineRunGraph/          # PipelineRun graph dialog
├── hooks/
│   ├── useTektonResults/          # Tekton Results data fetching
│   ├── usePipelineMetrics/        # Pipeline metrics aggregation
│   └── usePipelineActivityChart/  # Activity chart data
├── pages/
│   ├── pipeline-list/             # Pipeline list page
│   ├── pipeline-details/          # Pipeline details page
│   ├── pipelinerun-list/          # PipelineRun list page
│   ├── pipelinerun-details/       # PipelineRun details page
│   └── tekton-result-details/     # Tekton Result details page
└── utils/
    ├── celFilters.ts              # CEL expression builders
    └── statusIcons.ts             # Status icon utilities
```

Import patterns:

```typescript
// From within tekton module
import { TektonResultsTable } from "../components/TektonResultsTable";
import { usePipelineMetrics } from "../hooks/usePipelineMetrics";

// From other modules (e.g., observability)
import { usePipelineMetrics } from "@/modules/platform/tekton/hooks/usePipelineMetrics";
import { TektonResultsTable } from "@/modules/platform/tekton/components/TektonResultsTable";
```

### Configuration Module (Submodules Pattern)

The `configuration` module uses a submodules pattern because it contains many distinct configuration pages that share layout but have independent functionality:

```text
configuration/
├── components/                    # Shared configuration components
│   └── ConfigurationPageContent/
└── modules/                       # Configuration submodules
    ├── argocd/
    ├── clusters/
    ├── gitservers/
    ├── registry/
    └── ...
```

When to use submodules:

- Many distinct pages with independent functionality (10+ submodules)
- Pages share layout/navigation but not business logic
- Each submodule could conceptually be a separate feature

When NOT to use submodules (use flat structure instead):

- Few related entities (2-3) that share significant code
- Entities have tight coupling (parent-child relationships)
- Code reuse between entities is common

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

Page Architecture Pattern:

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

Dialog Implementation:

- Dialogs are specialized components designed to work exclusively with the `useDialogContext` hook
- Must be used in conjunction with the global `DialogContextProvider`
- Follow the same component structure as standard components

## File Naming Conventions

- Components: Use PascalCase for directories and files (`UserProfile/`, `index.tsx`)
- Pages: Use kebab-case for directories (`user-profile/`, `page.tsx`)
- Utilities: Use camelCase (`utils.ts`, `formatDate.ts`)
- Types: Use camelCase with `.ts` extension (`types.ts`, `userTypes.ts`)

## Testing Strategy

- Component tests: `index.test.tsx` (co-located with components)
- Page tests: `view.test.tsx` (testing the view logic separately from page setup)
- Utility tests: Within `utils/` folders for complex utilities

## Key Guidelines

1. Layer Boundaries: Respect the three-layer architecture:
   - `core/` - Domain-agnostic application infrastructure only
   - `k8s/` - Kubernetes API layer only (no UI components)
   - `modules/` - All feature-specific and domain-specific code

2. Domain Boundaries: Never place domain-specific code in `core/` or `k8s/`. If code references business entities (pipelines, codebases, etc.), it belongs in a feature module.

3. Related Entities Together: Combine related entities into a single module rather than creating separate modules. Examples: Codebase + CodebaseBranch in `codebases/`, Pipeline + PipelineRun in `tekton/`.

4. Component Isolation: Each component should be self-contained with its own types, constants, and utilities.

5. Page/View Separation: Always separate page setup (`page.tsx`) from page content (`view.tsx`) for better testability.

6. Import Direction:
   - Feature modules can import from `core/` and `k8s/`
   - `core/` and `k8s/` should never import from feature modules
   - Cross-module imports use `@/modules/platform/{module}/...` paths

7. K8s Module Scope: The `k8s/` module should contain:
   - API group definitions and resource configurations
   - Generic CRUD and watch hooks
   - Permission hooks
   - Resource constants and types

   It should NOT contain:
   - High-level UI components
   - Domain-specific business logic
   - Feature-specific utilities

8. Avoid Over-Engineering:
   - Prefer flat module structure over nested submodules
   - Use submodules only when there are many (10+) independent pages
   - Don't create separate "shared" modules - put shared code at the module root
