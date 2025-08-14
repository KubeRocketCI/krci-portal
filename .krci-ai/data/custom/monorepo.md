# Monorepo Architecture

## Overview

This project follows a monorepo architecture with clear separation of concerns between frontend, backend, and shared components. The structure promotes code reusability while maintaining strict boundaries between different layers of the application.

## Architecture Blocks

### 1. Client (`apps/client/`)

**Purpose**: Frontend codebase containing all UI/UX related code

**Responsibilities:**

- React components and pages
- UI state management
- User interactions and client-side logic
- Styling and visual components
- Client-specific utilities and helpers

### 2. Server (`apps/server/`)

**Purpose**: Backend for Frontend (BFF) providing API layer

**Responsibilities:**

- tRPC API endpoints
- Authentication and session management
- Kubernetes API integration
- Data transformation and validation
- WebSocket connections for real-time updates

**Technology Stack:**

- Node.js with TypeScript
- tRPC for type-safe APIs
- WebSocket for real-time communication
- Keycloak integration for auth

### 3. Shared (`packages/shared/`)

**Purpose**: Common code and models used by both client and server

**Structure:**

```
packages/shared/
├── src/
│   ├── models/
│   │   ├── auth/          # Authentication models
│   │   ├── user/          # User-related types
│   │   └── k8s/           # Kubernetes business models
│   │       ├── groups/    # Resource group definitions
│   │       └── core/      # Core K8s types and schemas
│   ├── utils/             # Shared utility functions
│   ├── constants/         # Application constants
│   └── schemas/           # Validation schemas
```

**Contains:**

- **Mutual Models**: Authentication, user data, common types
- **K8s Business Models**: Resource configurations, schemas, label selectors
- **Draft Creators**: Utility functions for creating K8s resource drafts
- **Validation Schemas**: Zod schemas for data validation
- **Constants**: API versions, operation types, shared enums

## Package Manager

**Always use pnpm as primary package manager.**

## Import Path Guidelines

### Critical Rule: Check tsconfig Before Imports

**Always verify each project's `tsconfig.json` for correct import path configuration before writing imports.**

### Import Patterns

#### ✅ Correct: Use Project-Internal Aliases

```typescript
// In client code
import { Button } from "@/core/components/ui/Button";
import { useAuth } from "@/core/auth/hooks/useAuth";

// In server code
import { createTRPCRouter } from "@/trpc/utils/createTRPCRouter";
import { authMiddleware } from "@/middleware/auth";
```

#### ❌ Incorrect: Never Use Root Project Name

```typescript
// DON'T DO THIS
import { Button } from "krci-portal/apps/client/src/core/components/ui/Button";
import { authMiddleware } from "krci-portal/apps/server/src/middleware/auth";
```

#### ✅ Cross-Package Imports (Shared Package)

```typescript
// From client or server to shared
import { K8sResourceConfig, createCodebaseDraft } from "@my-project/shared";
import { k8sCodebaseConfig, CodebaseDraft } from "@my-project/shared";
```

## Code Separation Rules

### Strict Domain Boundaries

**Rule**: Code must be placed in the appropriate block based on its intended usage.

#### Shared Package Criteria

Place code in `shared/` if it's used by **both** client and server:

```typescript
// ✅ Shared: Used by both client and server
export const getPipelineRunStatus = (
  pipelineRun: PipelineRun
): PipelineRunStatus => {
  return pipelineRun.status?.conditions?.[0]?.type || "Unknown";
};

// ✅ Shared: K8s resource configuration
export const k8sPipelineRunConfig = {
  apiVersion: "tekton.dev/v1beta1",
  kind: "PipelineRun",
  group: "tekton.dev",
  version: "v1beta1",
  // ...
} as const satisfies K8sResourceConfig;
```

#### Client-Only Code

Place in `client/` if it contains UI/UX specific logic:

```typescript
// ✅ Client-only: UI-specific utility
export const getPipelineRunStatusIcon = (status: PipelineRunStatus): React.ComponentType => {
  switch (status) {
    case "Running": return RunningIcon;
    case "Failed": return ErrorIcon;
    default: return UnknownIcon;
  }
};

// ✅ Client-only: React component
export const PipelineRunStatus: React.FC<Props> = ({ pipelineRun }) => {
  const Icon = getPipelineRunStatusIcon(getPipelineRunStatus(pipelineRun));
  return <Icon />;
};
```

## Monorepo Best Practices

- **Shared Dependencies**: Place common dependencies in root `package.json`
- Use TypeScript path mapping for clean imports
