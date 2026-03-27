<a name="unreleased"></a>
## [Unreleased]


<a name="v0.1.0"></a>
## v0.1.0 - 2026-03-27
### Features

- Add reusable form components and refactor configuration modules
- Add comprehensive platform overview dashboard with metrics components
- Add table skeleton loading, fix template selection
- add unified pipeline run view with log routing refactor and K8s watch optimization
- Add deployments related tours
- Add deployment related tours
- Redesign page layouts and tabs system with improved UI components
- Add projects module related tours
- Add form guides
- Show pipeline history in project page
- Add pipeline history in env page
- Update project page
- add GitLab CI template selection and tektonDisabled toggle for multi-CI support
- Add deployments widget on project page
- Update Python 3.13 version in frameworks ([#126](https://github.com/KubeRocketCI/krci-portal/issues/126))
- Add portal tours POC
- Enhance token expiration handling
- add pull request browsing to codebase details page
- add sidebar pinning for projects and deployments with quick-access section
- Add test connection buttons
- implement server-side PORTAL_URL for OIDC redirect URIs
- add dynamic collapsible group badges to profile popover
- add new Trivy security report types and UI pages
- separate API and Web UI URLs for SonarQube and Dependency Track
- add fallback redirect to Tekton Results for deleted PipelineRuns
- add Trivy configuration audit and cluster compliance report pages
- Migrate application form library provider
- add Trivy vulnerability scanning dashboard and consolidated image view
- populate Tekton result annotations with actual values for manual pipeline triggers
- refactor resource protection handling with explicit API
- add support for security pipelines in codebase branch management
- Add complex story example
- Enhance testing
- add SonarQube SAST integration for code quality visibility
- Align pipeline run lists
- Add support for SCA
- Add pipeline metrics page
- Add support for the Tekton Result API
- Env wizard ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Add java25 ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Codebase and Deployment wizards ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Improve home page, add token auth ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate ui 2 ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate mui to shadcn components ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Finish migration ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate marketplace end ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate marketplace ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate configuration ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate pipelines ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Add KubeRocketCI Web Portal FullStack Agent
- Migrate deployment flows ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate overview module ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate components to new codebase ([#2](https://github.com/KubeRocketCI/krci-portal/issues/2))

### Bug Fixes

- Tour issue and other
- resolve critical bugs and optimize form component refactoring
- align table selection column header with body cells
- restore Pipeline diagram tab by fixing PageContentWrapper flex height chain
- Sast jwt issues
- Improve dashboard component code quality and fix date validation
- Resolve validation, layout, and component issues across codebase
- Preserve JWT id_token during Azure AD token refresh to prevent K8s auth failures
- Revert Distinguish K8s 401 auth failures from 403 RBAC denials in error handling
- Distinguish K8s 401 auth failures from 403 RBAC denials in error handling
- After patch issues
- prevent long branch names from overflowing in pipeline table
- Multiple issues
- Add cryptographic JWT signature verification in OIDC client
- Project multi delete and other
- Issues
- Release branch name ([#132](https://github.com/KubeRocketCI/krci-portal/issues/132))
- Remaining projects titles
- Pinned items when sidebar is collapsed ([#130](https://github.com/KubeRocketCI/krci-portal/issues/130))
- Pnpm build tool
- Create codebase wizard nav
- Sanitize svg base64 input and output
- display persistent error messages when K8s CRDs inaccessible
- normalize OIDC groups claim for providers
- Pagination URL persistance
- Issues with pipelineruns
- Deploy configuration table switchers
- Use localeCompare for reliable namespace sorting and prevent array mutation
- App chooser in cdpipeline edit
- Edit cdpipeline ([#74](https://github.com/KubeRocketCI/krci-portal/issues/74))
- Logs viewer updates
- Resolve infinite spinner on Registry configuration page when secrets don't exist
- Values override persistant state in deploy configuration, refactor table form
- Routing after tanstack router update
- Values override pagination
- Fix formating
- Resolve lint and TypeScript errors
- Remove opensearch history
- Hardcoded ingresses ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1)) ([#51](https://github.com/KubeRocketCI/krci-portal/issues/51))
- Esm imports 2 ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Import issue ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Websocket before auth problems ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Esm imports ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Post ui migrate ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Release branch options
- Project setup ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Post migration fixes 2 ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Post migrate ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migration fixes ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migration fixes ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Refactor filters ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- K8s request ca file read ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Add k8s request debug logs ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Client vars usage ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1)) ([#28](https://github.com/KubeRocketCI/krci-portal/issues/28))
- Sast errors ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Some build scenarios ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Format date test ([#2](https://github.com/KubeRocketCI/krci-portal/issues/2))

### Code Refactoring

- extract shared stage deployment cards component and add JWT utility tests
- Align OIDC token refresh with OIDC spec
- address code review findings for projects tours feature
- improve GitLab CI template selection with inline rich display
- Rename entities
- Multiforms move to backend
- reduce nested function complexity in useUpdateJiraMapping hook
- simplify logs viewer components with extracted utilities
- Refactor Tekton Task modules structure
- Refactor Tekton Pipeline modules structure

### Testing

- Add comprehensive tests for tRPC auth error handling

### Routine

- Update README.md file
- Add tests
- Rename components to projects
- Rename Pipeline History tab
- Update vitest sonar cfgs
- Update deployment configuration to use gitfusion
- Add callmevladik to code owners
- Add apiVersion parameter for eso objects
- Align helm chart
- Align helm chart
- Update dependencies
- Update krci-ai to the latest stable version
- Add immer in server ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Migrate External Secrets resources to v1 API version ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Rename static folder path ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Add Env variables and secret examples for deploy([#2](https://github.com/KubeRocketCI/krci-portal/issues/2))
- Bump CodeQL version ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Align github templates ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Add community standards and repository description ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Fix env examples gitignore ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Polish dev env ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Improve initial setup ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))
- Setup initial code ([#1](https://github.com/KubeRocketCI/krci-portal/issues/1))


[Unreleased]: https://github.com/KubeRocketCI/krci-portal/compare/v0.1.0...HEAD
