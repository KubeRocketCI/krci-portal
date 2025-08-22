# Technology Stack

## Version Management

**Critical Rule**: Always check `package.json` files for actual dependency versions before code generation.

```bash
cat apps/client/package.json | grep -A 20 "dependencies"
cat apps/server/package.json | grep -A 20 "dependencies"
```

## Frontend (`apps/client/`)

- **React + TypeScript + Vite**: Core framework with fast builds
- **TanStack Router**: File-based routing with type safety
- **TanStack React Query**: Server state management and caching
- **tRPC Client**: Type-safe API communication
- **Zustand**: Lightweight client state for UI
- **React Hook Form (RHF)**: Forms with Zod validation
- **Tailwind + MUI + Emotion**: Styling and UI components
- **Vitest**: Testing

## Backend (`apps/server/`)

- **Fastify + TypeScript**: High-performance server
- **tRPC Server**: Type-safe API endpoints
- **better-sqlite3**: Session storage
- **OIDC**: Keycloak authentication integration
- **WebSocket**: Real-time Kubernetes resource watching
- **esbuild**: Fast compilation
- **Vitest**: Testing

## Shared (`packages/shared/`)

- **TypeScript + Zod**: Shared types and validation schemas
- **K8s Resource Configs**: Typed Kubernetes resource definitions
- **Draft Creators**: Utility functions for K8s resource creation
