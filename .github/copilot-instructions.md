# KRCI Portal Project Custom Instructions for GitHub Copilot

This file provides guidance to GitHub Copilot to ensure generated content aligns with the KRCI Portal project standards.

## Project Context

KRCI Portal is a modern web-based user interface for KubeRocketCI, providing a comprehensive platform for managing CI/CD pipelines, codebases, and deployment flows in Kubernetes environments.

## Technology Stack

- **Frontend**: React 19 with TypeScript, TanStack Router, Zustand + TanStack Query, Material-UI + Radix UI + Tailwind CSS, Vite
- **Backend**: Fastify with TypeScript, tRPC for type-safe APIs, SQLite with better-sqlite3
- **Shared**: Zod schemas, full TypeScript coverage, pnpm workspaces
- **Deployment**: Kubernetes, Helm charts, Docker

## Pull Request Guidelines

When generating PR titles and descriptions, please refer to the [PR generation guidelines](./instructions/pr-generation.instructions.md) if available.

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code with strict type checking
- Follow functional programming patterns where appropriate
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer composition over inheritance
- Use proper error handling with appropriate context
- Follow project structure conventions:
  - `/apps/client` - React frontend application
  - `/apps/server` - Fastify backend API
  - `/packages/shared` - Shared types and utilities
  - `/deploy-templates` - Helm charts for deployment

### React/Frontend

- Use functional components with hooks
- Implement proper state management with Zustand
- Use TanStack Query for server state management
- Follow Material-UI and Tailwind CSS patterns
- Implement proper error boundaries
- Use TypeScript interfaces for component props
- Follow accessibility best practices

### Backend/API

- Use Fastify framework patterns
- Implement tRPC for type-safe APIs
- Use Zod for validation schemas
- Follow RESTful API principles where applicable
- Implement proper error handling and logging
- Use dependency injection patterns

## Documentation Guidelines

- Document all public APIs with JSDoc
- Include examples for complex functionality
- Keep README.md files up to date
- Use proper Markdown formatting
- Document component props and API endpoints
- Include setup and development instructions

## Testing Guidelines

- Write unit tests for all functions and components
- Use Vitest for testing framework
- Include integration tests for API endpoints
- Aim for high test coverage
- Mock external dependencies appropriately
- Test both happy path and error scenarios
- Use React Testing Library for component tests

## Security Guidelines

- Validate all inputs using Zod schemas
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Follow OWASP security best practices
- Sanitize user inputs
- Implement proper session management
