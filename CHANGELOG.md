<a name="unreleased"></a>
## [Unreleased]


<a name="v0.9.0"></a>
## [v0.9.0] - 2026-10-20
### Features

- add CEL filter validator and literal builder
- stop selected PipelineRuns from the list
- stop PipelineRuns in batch through pipelineRun.stop
- plan PipelineRun stop as a graceful merge patch
- publish the build managed params in the OpenAPI document
- expose POST /rest/v1/pipelineruns/build
- add the pipelineRun.build procedure
- discover whether the cluster serves an optional type before watching it
- one table shell with a server pagination mode
- one behaviour for text in table cells
- let users resize table columns by dragging the header edge
- drive pipeline metrics filters from the URL
- derive the git server secret name from the server name

### Bug Fixes

- Match the Capsule quota annotation by key prefix
- Strip the pipeline-reported annotation when re-running a PipelineRun
- Match Capsule 0.14 tenant label in the resource quota indicator
- Fall back to global.dnsWildCard for the default host
- move maxParamLength under routerOptions to drop the FSTDEP022 warning
- bump the Node base image to 22.23.3 for [@fastify](https://github.com/fastify)/static 10
- update vulnerable dependencies and adapt to [@fastify](https://github.com/fastify)/static 10
- build the REST error envelope from allow-listed constants
- show the request id and actionable text for GitFusion errors
- validate CEL filters at the tRPC boundary and results client
- map upstream transport failures on REST routes to 502/503/504
- restore the Codebase Dependencies tab preload
- stop preloading the Codebase Dependencies tab chunk
- derive table columns from the current prop instead of freezing them in state
- dispose the terminal on unmount
- hide open overlays of a hidden tab
- reset copy confirmations when a tab is hidden
- follow container resizes in tables after a tab re-show
- keep metric series hidden from the legend after a tab re-show
- keep unsaved stage variables when the tab is shown again
- clear the live log view before each log stream replay
- show static step logs once after the tab is shown again
- recreate Monaco editors when their tab is shown again
- align the stop dialog with the platform's action dialogs
- show a minus for a partly selected table page
- stop the table jumping when rows are selected
- key PipelineRun selection by uid
- stop PipelineRuns with the patch verb
- show the number of PipelineRuns the list displays
- count only shown archive rows in the PipelineRun history footer
- Show full status and condition messages on hover
- derive pin identity inside the pin store
- show custom resources when an allowed namespace fails to list
- derive multi-namespace list rows in the same render as their loading state
- detect session expiry in a tRPC link instead of buffering streamed batches
- keep the branch table loading until the branch watch is ready
- mount tab content on first visit and pause hidden tabs
- build a table's sort from the column, not from its id
- serve Monaco and fonts from the bundle for air-gapped clusters
- reject a page or page size the pager cannot render
- keep a corrupt table preference from taking the page down
- report and recover from an undecodable SVG icon
- address the Capsule Tenant as a cluster-scoped resource
- preserve the HTTP status of a watch error
- let the item watch report an absent object
- validate the live resource at the input boundary
- classify TaskRun state through one shared phase
- draw every counted state in Resource Health
- classify PipelineRun state through one shared phase
- clip table cell content to its column
- give dialog openers a stable identity
- restore saved column visibility in the table shell
- allow deleting the last Environment of a CD pipeline
- offer Next.js as a JavaScript library framework
- check PipelineRun create permission when running a pipeline
- show the Cluster Certificate field when TLS verification is enabled

### Code Refactoring

- build client CEL filters through the shared validator
- preload the Codebase Dependencies tab and start its requests on mount
- move the pipeline preview widgets to the Tekton module
- load the Codebase Dependencies tab on first visit
- load terminal, logs and pipeline graph dialogs on first open
- load only the named Codebases, CodebaseBranches and CodebaseImageStreams on the Applications tabs
- cache hashed client assets and return 404 for missing ones
- start the run lists with the PipelineRun request
- stop listing all Tasks on the PipelineRun details page
- render the selected count in the table
- share the TriggerTemplate naming convention
- share the PipelineRun start output shape
- export the build draft's managed param names
- one HTTP transport behind the integration clients
- one factory behind the integration mutations
- one shared KRCI status enum
- read column visibility only in the table shell

### Testing

- cover the pipelineRun.build contract

### Routine

- bump Go to 1.26.9
- add the build operation to the published API document
- drop the table's unread URL pagination option
- ignore the Storybook build output in eslint
- Update current development version

### Documentation

- update portal CEL filter convention


<a name="v0.8.0"></a>
## [v0.8.0] - 2026-08-10
### Features

- surface EventListener labelSelector in list and topology views
- persist SQLite session store on an optional PVC
- flag duplicate projects inline in the create wizard

### Bug Fixes

- validate branch deletion against the operator webhook instead of guessing client-side
- resolve the TriggerTemplate ServiceAccount placeholder for portal-started PipelineRuns
- resolve PipelineRun history timestamps across both Tekton Results watcher generations
- stop PipelineRuns gracefully so finally tasks report the VCS commit status
- correct Prettier format-on-write hook
- Correct edpDefault HTTPRoute hostname
- bind each pipeline task to its own TaskRun
- remove ReDoS-prone regex from git URL path normalization
- make SQLite DB directory writable for the non-root runtime user
- harden integration configuration against SSRF probing and stored XSS
- render archived PipelineRuns with an unfinalized Tekton Results summary as terminal, not Running

### Code Refactoring

- drop dead Jira-era params from the build PipelineRun draft

### Routine

- trigger Claude PR review only on explicit /review commands
- Update current development version


<a name="v0.7.0"></a>
## [v0.7.0] - 2026-07-20
### Features

- render cancelled PipelineRuns as a neutral state instead of failed
- add in-app notifications hub with real-time delivery and per-user read state

### Bug Fixes

- restyle notification toasts and close notification interaction gaps

### Routine

- Update current development version


<a name="v0.6.0"></a>
## [v0.6.0] - 2026-07-13
### Features

- show stale badge for codebase branches missing in git
- add Monitoring tab with per-step resource metrics on PipelineRun details
- replace docs link with YouTube channel card
- replace audit From/To text inputs with a single date-range picker
- add admin audit events page with role-based access control
- show "Triggered By" actor on PipelineRun details
- show current deployed version in stage deploy dropdown
- add optional HTTPRoute (Envoy Gateway) support to chart
- improve Tekton pipeline run history footer UX
- add GitLab CI pipeline list and log viewer for codebases
- Register Gateway API and traffic policy resource descriptors
- add Envoy Gateway and Gateway API support in Portal
- add permission-aware Custom Resources catalog for users without cluster-wide CRD access
- reduce Kubernetes events volume on overview and detail views
- redesign Kubernetes cluster overview dashboard
- add Service Account token login and make OIDC optional
- enrich Kubernetes resource overview tabs and list descriptors
- router registration — CRD detail + CR parent/list/detail routes
- Scale + Restart + Rollback action UI components + Deployment, StatefulSet, DaemonSet descriptor wiring
- workload mutation hooks (useK8sActionMutation, useK8sScale, useK8sRestart, useK8sRollback, useDeploymentRevisions, useHpaForTarget) + useUpdatePermission
- K8sDetailPage — actionsSlot + ButtonWithPermission Delete + useDetailTabs
- Custom Resources sidebar group (useCRSidebarItems + K8sSidebar + nav.ts)
- Custom Resource detail page (cluster-scoped + namespaced)
- Custom Resource list page (CRListView, CRListFilter, routes)
- CRD list descriptor + CRD detail page
- CRD/CR infra hooks + ConditionsTable + PrinterColumnValue + extractByJsonPath + useDetailTabs + buildCRDescriptor
- workload utility helpers + scale/restart/rollback/listRevisions procedures + k8sRouter wiring
- HoverInfoLabel primitive + Radix Slider primitive + [@radix](https://github.com/radix)-ui/react-slider dependency
- CRD/CR path constants + registry descriptor shape + resolveDescriptor slug fallback
- collapsible sidebar sub-group — NavCollapsibleSubGroupItem + SidebarCollapsibleSubGroupMenuItem
- drop apiVersion from server input + client hook; group-aware watch/permission cache keys
- K8sClient patchResource/listAllResources + getInitializedK8sClient + rethrowOrHandleK8sError
- add patch verb, KubeCondition, CRD model, and ReplicaSet model
- Add scroll-to-top/bottom controls to LogViewer
- Add branch column to pipeline applications table

### Bug Fixes

- clear stale Git URL Path validation when switching Git server provider
- don't treat GitServer-owned credentials Secret as externally managed
- show Add variable button once Stage ConfigMap permissions resolve
- replace NetListener.tlsSecret with structured tlsCertificateRef
- derive OIDC identity from ID Token to fix Entra ID member login
- prevent intermittent "Not Found" on Overview and namespace-scoped pages
- prevent silent submit when creating an environment without a Clean Pipeline template
- use K8s response to build success toast route
- Align notification area for envoy
- honor allowed namespaces in Kubernetes mode list views
- populate Deployed version dropdown on CD promotion stages in multi-pipeline clusters
- exclude EDP from codebase versioning type selection
- bump concurrently to patch shell-quote CVE-2026-9277
- make sidebar pin keys param-aware and restore icons for pinned pages
- align K8s mode list pages with KRCI list layout
- Set gitlabci icon on the project page
- remediate dependency vulnerabilities and harden npm supply chain
- enable search filtering in freeSolo combobox
- replace backtracking trailing-slash regex with linear stripTrailingSlash helper
- render mode switcher as icon-only toggle in collapsed sidebar
- prevent release branches from being created from a commit
- useDeploymentRevisions refetch-on-mount for live rollback data
- DataTable and ServerSideTable — useColumnSync + useSyncedSortState hooks
- DeleteKubeObject — ReactNode description + mutateAsync navigation guard
- ConfirmDialog isPending guard
- Align stage quality gate step name validation to min 2 characters
- Fix silent save failure in resource edit forms
- Align inputDockerStreams with applications positionally in create wizard
- Reject misrouted branches in pipeline applications column
- Improve LogViewer controls layout and focus visibility

### Code Refactoring

- extract StaleBadge component with Storybook coverage
- remove unused BranchListItem accordion components
- address review findings in sidebar predicate, sort-state, detail-page

### Routine

- Move Tekton Details to Configuration section
- bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- align dependabot commit messages with PR validation and reduce PR noise
- drop transitional route-type casts after registration
- Remove dead alignInputDockerStreams utility
- Update current development version

### Documentation

- correct server framework in CLAUDE.md


<a name="v0.5.0"></a>
## [v0.5.0] - 2026-05-21
### Features

- Add sonar deptrack error message ([#262](https://github.com/KubeRocketCI/krci-portal/issues/262))
- Add k8s mode resources explorer
- Add webhook Triggers portal module
- Add pipelinerun error description
- Add PipelineRun trigger endpoint with CLI parameter support
- Add severity filtering to SCA findings REST endpoint
- Per-pod, history-aware Stage Monitoring
- Extend Stage Monitoring with network/storate metrics
- Add native deployment metrics on Stage Monitoring tab
- Allow filtering pipeline runs by any platform-registered projects
- Refactor pipeline run list filtering with payload-aware codebase detection
- Improve pipelinerun list querying
- Implement server-side severity filtering with auto-paging and cancellation
- Add SCA REST endpoints with Dep-Track integration
- Add SonarQube branch scope support
- Add SonarQube pr support and rest proxy ([#238](https://github.com/KubeRocketCI/krci-portal/issues/238))
- Add create resource button

### Bug Fixes

- Align OpenAPI spec to actual REST error envelope shape
- Preserve pod template and task scheduling config in pipeline rerun
- Prevent K8s watch reconnect storm on stale resourceVersion
- Block branch deletion when used by a deployment flow
- Handle protojson null values in Tekton Results output schema
- Declare labels, annotations, creationTimestamp in K8s metadata schema
- Hide tours on smaller devices
- Reset filters
- Tekton resources statuses
- Multiple UI and security improvements
- Broken links when config is not loaded ([#229](https://github.com/KubeRocketCI/krci-portal/issues/229))
- Show corret PipelineRuns in stage details

### Code Refactoring

- Remove ConfigMap-based GitFusion feature gate
- Server tests mocks ([#244](https://github.com/KubeRocketCI/krci-portal/issues/244))
- Fix rbac operations naming
- Replace string literals with typed enum constants
- Simplify SonarQube client and procedures
- Replace sonar search  with browse-level api

### Routine

- Tune column width for pipelinerun page
- Revert Node.js and better-sqlite3 upgrades to stable versions
- Upgrade better-sqlite3 to v12    Update better-sqlite3 dependency to v12.9.0, which is compatible with node 24
- Update Node.js runtime and remove redundant build step
- Set Helm chart fullnameOverride to krci-portal
- Update current development version


<a name="v0.4.0"></a>
## [v0.4.0] - 2026-04-13
### Features

- Resolve full PipelineRun data for historical rerun actions
- Enable rerun actions for historical PipelineRuns
- Add 'Started at' sortable column to PipelineRun table
- Add PipelineRun name search filter to list views
- Add copy and download buttons for step logs

### Bug Fixes

- Security issues in openapi generation
- Edit cdpipeline with mixed spec
- Add sidebar pinning for generic pages and improve Tekton and branch UX
- Branch diff in cdpipeline edit
- Project details page tour
- Pipelines page crash and tt params undefined value

### Routine

- Update current development version


<a name="v0.3.0"></a>
## [v0.3.0] - 2026-04-08
### Features

- Add REST API endpoints and OpenAPI spec generation

### Bug Fixes

- Improve responsiveness of generic components and pages
- Edit form guides configs
- Make apiVersion and kind optional on Kubernetes list items
- GitOps form issues, stage breadcrumbs, deployment create btn permission

### Code Refactoring

- Protect config.get   endpoint and move cluster config to authenticated   tree

### Routine

- Regenerate REST client after optional apiVersion/kind fix
- Update current development version
- Remove krci-ai framework


<a name="v0.2.0"></a>
## [v0.2.0] - 2026-04-04
### Features

- Expose OIDC issuer URL in config.get response
- Align security pages layouts
- Enable CHANGELOG.md generation

### Bug Fixes

- Resolve pagination failure in Tekton Results PipelineRun query
- Resolve misaligned inputDockerStreams in CDPipeline edit form
- Add promise coalescing to getSummary cache to prevent thundering herd
- Performance bottleneck in tekton results
- Map GitFusion HTTP status codes to tRPC error codes
- Throttle live log subscription to prevent page freezing

### Code Refactoring

- Improve CDPipeline form handling
- Switch PipelineRun list from records to results table

### Routine

- Disable debug for claude review pipeline
- update commit message length validation
- Update current development version


<a name="v0.1.0"></a>
## v0.1.0 - 2026-03-27
### Features

- Improve project details page
- Improve ScrollCopyText component
- Add deployment submit review step
- Minimize logs tab
- Enhance FormCombobox, fix recent issues ([#171](https://github.com/KubeRocketCI/krci-portal/issues/171))
- populate imageDigest in manual deploy payload
- extend Zod schema to support digest
- show deployed image reference with digest in environment view
- Add Cancel button to EditGitServerForm actions
- Complete Registry module refactoring to independent Create/Edit forms
- Restructure integration forms and add FormGuide
- add on-demand PR review workflow with plugin agents
- add Bearer token authentication to protected tRPC procedures
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

- Correct form validation and error handling in edit wizards
- History pipelinerun select
- auto-restart K8s watch on API server timeout and improve stale data recovery
- Pipelinerun page offset
- position trigger badge and resolve TriggerTemplate to Pipeline
- strip only watcher-grouping annotations from re-run PipelineRuns
- populate applicationsToPromote from canonical applications field
- Remove inline comments for review pipeline
- Hide Authentication section for non-ECR registry types
- Tune claudecode with sun-agent
- Allow claudecode to run python3
- Allow claudecode to run python3 command
- Tune claudecode review pipeline
- Tune claudecode review pipeline
- Prevent infinite review loop from bot-generated comments
- Correct PR review metrics extraction and documentation
- Consolidate banner rendering in unified log viewer
- Improve PR review workflow reliability and add metrics reporting
- strip results.tekton.dev annotations from re-run PipelineRuns
- Tune claude-agent for the review flow
- Debug claude code commands for review
- Fix plugins installation for GH Actions
- strip triggers.tekton.dev labels from re-run PipelineRuns
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

- remove log source disclosure from UI
- Polish existing integration form structure and layouts
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

- Align repository path for image
- fix Dependabot security vulnerabilities in dependencies
- validate commit title length and format
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


[Unreleased]: https://github.com/KubeRocketCI/krci-portal/compare/v0.9.0...HEAD
[v0.9.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.8.0...v0.9.0
[v0.8.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.7.0...v0.8.0
[v0.7.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.6.0...v0.7.0
[v0.6.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.5.0...v0.6.0
[v0.5.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.4.0...v0.5.0
[v0.4.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.3.0...v0.4.0
[v0.3.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/KubeRocketCI/krci-portal/compare/v0.1.0...v0.2.0
