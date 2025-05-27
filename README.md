# KRCI Portal

[![Version](https://img.shields.io/badge/Version-1.0.0-informational?style=flat-square)](https://github.com/KubeRocketCI/krci-portal)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE.txt)

> **KRCI Portal** is a modern web-based user interface for [KubeRocketCI](https://docs.kuberocketci.io/), providing a comprehensive platform for managing CI/CD pipelines, codebases, and deployment flows in Kubernetes environments.

## 🚀 Overview

KRCI Portal serves as the central management hub for the KubeRocketCI ecosystem, enabling developers and DevOps teams to:

- **Manage Codebases**: Create and manage applications, libraries, autotests, and infrastructure components
- **CI/CD Pipeline Management**: Configure and monitor Tekton-based CI/CD pipelines
- **Deployment Flows**: Orchestrate application deployments across multiple environments
- **GitOps Integration**: Seamless integration with Git servers and Argo CD for GitOps workflows
- **Real-time Monitoring**: Track pipeline executions, deployment statuses, and resource health

## ✨ Key Features

### 🏗️ Codebase Management

- **Multi-type Support**: Applications, Libraries, Autotests, Infrastructure, and System components
- **Git Integration**: Support for GitHub, GitLab, Gerrit, and Bitbucket
- **Branch Management**: Create and manage feature branches with automated pipelines
- **Quality Gates**: Integrated SonarQube analysis and security scanning

### 🔄 CI/CD Pipelines

- **Tekton Integration**: Native support for Tekton pipelines and tasks
- **Build Automation**: Automated builds with multiple build tools (Maven, Gradle, npm, etc.)
- **Testing**: Automated testing with quality gates and coverage reports
- **Security Scanning**: SAST/SCA analysis with vulnerability reporting

### 🚢 Deployment Management

- **Environment Management**: Create and manage deployment environments
- **GitOps Workflows**: Argo CD integration for declarative deployments
- **Progressive Delivery**: Support for blue-green and canary deployments
- **Rollback Capabilities**: Easy rollback to previous versions

### 🔧 Platform Features

- **Multi-cluster Support**: Manage multiple Kubernetes clusters
- **RBAC Integration**: Role-based access control with Keycloak/OIDC
- **Real-time Updates**: WebSocket-based real-time status updates
- **Extensible Architecture**: Plugin-based architecture for custom integrations

## 🏛️ Architecture

KRCI Portal follows a modern monorepo architecture with clear separation of concerns:

```bash
krci-portal/
├── apps/
│   ├── client/          # React frontend application
│   └── server/          # Fastify backend API
├── packages/
│   └── shared/          # Shared types and utilities
├── deploy-templates/    # Helm charts for deployment
└── docs/               # Documentation
```

### Technology Stack

#### Frontend (Client)

- **Framework**: React 19 with TypeScript
- **Routing**: TanStack Router
- **State Management**: Zustand + TanStack Query
- **UI Components**: Material-UI + Radix UI + Tailwind CSS
- **Build Tool**: Vite

#### Backend (Server)

- **Framework**: Fastify with TypeScript
- **API**: tRPC for type-safe APIs
- **Database**: SQLite with better-sqlite3
- **Authentication**: Session-based with OIDC integration
- **Kubernetes**: Official Kubernetes client

#### Shared

- **Validation**: Zod schemas
- **Type Safety**: Full TypeScript coverage
- **Monorepo**: pnpm workspaces

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 10+
- Kubernetes cluster with KubeRocketCI installed
- Access to the cluster with appropriate RBAC permissions

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/KubeRocketCI/krci-portal.git
   cd krci-portal
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development servers**

   ```bash
   pnpm dev
   ```

   This starts both the client (port 5173) and server (port 3000) in development mode.

4. **Access the application**
   - Frontend: <http://localhost:5173>
   - Backend API: <http://localhost:3000>

### Production Deployment

#### Using Helm (Recommended)

```bash
helm repo add krci-portal https://kuberocketci.github.io/krci-portal
helm install krci-portal krci-portal/krci-portal
```

#### Using Docker

```bash
docker build -t krci-portal .
docker run -p 8080:8080 krci-portal
```

## 📖 Documentation

- **[User Guide](https://docs.kuberocketci.io/docs/user-guide)** - Complete user documentation
- **[Development Guide](https://docs.kuberocketci.io/docs/developer-guide)** - Development setup and guidelines

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpm test:coverage`
5. Run linting: `pnpm lint`
6. Format code: `pnpm format:check`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Code Quality

- **Testing**: Vitest for unit and integration tests
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier for consistent code style
- **Type Checking**: Full TypeScript coverage
- **Quality Gates**: SonarQube analysis on all PRs

## 🔒 Security

Security is a top priority for KRCI Portal. Please review our [Security Policy](SECURITY.md) for:

- Reporting security vulnerabilities
- Security best practices
- Supported versions

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE.txt) file for details.

## 🌟 Community & Support

- **Documentation**: [docs.kuberocketci.io](https://docs.kuberocketci.io/)
- **GitHub Issues**: [Report bugs and request features](https://github.com/KubeRocketCI/krci-portal/issues)
- **GitHub Discussions**: [Community discussions](https://github.com/orgs/KubeRocketCI/discussions/)
- **Code of Conduct**: [Community guidelines](CODE_OF_CONDUCT.md)

## 🙏 Acknowledgments

- [KubeRocketCI Team](https://github.com/KubeRocketCI) for the amazing platform
- [Tekton](https://tekton.dev/) for the CI/CD pipeline engine
- [Argo CD](https://argoproj.github.io/cd/) for GitOps capabilities
- All our [contributors](https://github.com/KubeRocketCI/krci-portal/graphs/contributors)

## 📊 Project Status

- **Current Version**: 0.1.0-SNAPSHOT
- **Development Status**: Active
- **Maintenance**: Actively maintained
- **Support**: Community supported

---

<div align="center">
  <strong>Built with ❤️ by the KubeRocketCI community</strong>
</div>
