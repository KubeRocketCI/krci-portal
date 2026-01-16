# Testing Plan - KRCI Portal

**Generated:** 2026-01-15
**Coverage Configuration:** Updated with proper exclusions

---

## 📊 Summary Statistics

| Metric | Count | Status |
|--------|-------|--------|
| **Total Files Requiring Tests** | 280 | Tracked in coverage |
| **Files With Tests** | 29 | ✅ 10.3% |
| **Files Without Tests** | 251 | ⚠️ 89.6% |


### Coverage by Category

| Category | Without Tests | Priority |
|----------|---------------|----------|
| **Custom Hooks** | 152 | 🔴 High |
| **Components** | 107 | 🟡 Medium |
| **Other TypeScript** | 96 | 🟡 Medium |
| **Utils (index.ts)** | 33 | 🔴 High |
| **Utils (other)** | 11 | 🔴 High |
| **Services/API** | 11 | 🔴 High |
| **Stores** | 4 | 🟡 Medium |
| **Config Files** | 3 | 🟢 Low |

---

## 🎯 Priority Levels

### Priority Explanation
- **🔴 High Priority**: Business logic, utilities, services - core functionality
- **🟡 Medium Priority**: State management, complex components
- **🟢 Low Priority**: Config files, simple wrappers

---

## 🔴 HIGH PRIORITY: Utilities (44 files)

### Utils with Logic in index.ts (33 files)
These are utility functions in dedicated folders that should have tests alongside them.

- [ ] `core/utils/classname/index.ts`
- [ ] `core/utils/date-humanize/index.ts`
- [ ] `core/utils/download/index.ts`
- [ ] `core/utils/isComponentType/index.ts`
- [ ] `core/utils/toElement/index.ts`
- [ ] `k8s/api/groups/ArgoCD/Application/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/ArgoCD/Application/utils/getSyncStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/ApprovalTask/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/CDPipeline/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/Codebase/utils/getMappingByType/index.ts`
- [ ] `k8s/api/groups/KRCI/Codebase/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/CodebaseBranch/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/CodebaseBranch/utils/sort/index.ts`
- [ ] `k8s/api/groups/KRCI/Codemie/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/CodemieApplication/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/CodemieProjectSettings/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/GitServer/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/JiraServer/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/KRCI/QuickLink/utils/getURLsFromList/index.ts`
- [ ] `k8s/api/groups/KRCI/QuickLink/utils/isSystemQuickLink/index.ts`
- [ ] `k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications/index.ts`
- [ ] `k8s/api/groups/KRCI/Stage/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/Tekton/Pipeline/utils/getURLsFromList/index.ts`
- [ ] `k8s/api/groups/Tekton/PipelineRun/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/Tekton/TaskRun/utils/getStatusIcon/index.ts`
- [ ] `k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon/index.ts`
- [ ] `k8s/integrations/secret/utils/getStatusIcon/index.ts`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/utils/checkHighlightedButtons/index.ts`
- [ ] `packages/trpc/src/routers/k8s/utils/createCustomResourceURL/index.ts`
- [ ] `packages/trpc/src/routers/k8s/utils/createEventQueue/index.ts`
- [ ] `packages/trpc/src/routers/k8s/utils/createK8sWatchSubscription/index.ts`
- [ ] `packages/trpc/src/routers/k8s/utils/createLabelSelectorString/index.ts`
- [ ] `packages/trpc/src/routers/k8s/utils/handleK8sError/index.ts`

### Other Utility Files (11 files)

- [ ] `core/components/ResourceQuotas/utils/convertToNumber.ts`
- [ ] `core/components/ResourceQuotas/utils/parseResourceQuota.ts`
- [ ] `core/utils/date-humanize/utils.ts`
- [ ] `core/utils/forms/getUsedValues.ts`
- [ ] `core/utils/forms/mapToSelectOptions.ts`
- [ ] `k8s/api/utils/get-forbidden-error.ts`
- [ ] `modules/platform/security/pages/sast-project-details/utils/formatters.ts`
- [ ] `modules/platform/security/pages/sca/utils/cvss.ts`
- [ ] `modules/platform/tekton/components/PipelineDiagram/utils/layoutUtils.ts`
- [ ] `modules/platform/tekton/utils/celFilters.ts`
- [ ] `modules/platform/tekton/utils/statusIcons.ts`

---

## 🔴 HIGH PRIORITY: Services & API Integrations (11 files)

These handle external integrations and API calls - critical for reliability.

- [ ] `core/services/local-storage/index.ts`
- [ ] `core/services/local-storage/keys.ts`
- [ ] `k8s/services/link-creation/index.ts`
- [ ] `k8s/services/link-creation/utils.ts`
- [ ] `clients/db-session-store/__mocks__/index.ts`
- [ ] `packages/trpc/src/clients/dependencyTrack/index.ts`
- [ ] `packages/trpc/src/clients/index.ts`
- [ ] `packages/trpc/src/clients/k8s/K8sApiError.ts`
- [ ] `packages/trpc/src/clients/krakend/index.ts`
- [ ] `packages/trpc/src/clients/sonarqube/index.ts`
- [ ] `packages/trpc/src/clients/tektonResults/index.ts`

---

## 🔴 HIGH PRIORITY: Custom Hooks (152 files)

Business logic hooks that manage state, data fetching, and complex operations.

### By Module

#### Core Hooks

- [ ] `core/components/DataGrid/hooks/usePagination.ts`
- [ ] `core/components/DataGrid/hooks/useReadyData.ts`
- [ ] `core/components/PodLogsTerminal/hooks/usePodLogs.ts`
- [ ] `core/components/Table/components/TableSettings/hooks/useTableSettings.ts`
- [ ] `core/components/Table/hooks/useFilteredData.ts`
- [ ] `core/components/Table/hooks/usePagination.ts`
- [ ] `core/hooks/useClickOutside.ts`
- [ ] `core/hooks/useHandleEditorSave.ts`
- [ ] `core/hooks/useSidebarMenu.ts`
- [ ] `core/hooks/useTheme.ts`

#### Platform Module Hooks

- [ ] `modules/platform/cdpipelines/dialogs/EditCDPipeline/hooks/useDefaultValues.ts`
- [ ] `modules/platform/cdpipelines/dialogs/EditStage/hooks/useDefaultValues.ts`
- [ ] `modules/platform/cdpipelines/dialogs/ManageStage/components/Create/hooks/useDefaultValues.ts`
- [ ] `modules/platform/cdpipelines/dialogs/ManageStage/components/Edit/hooks/useDefaultValues.ts`
- [ ] `modules/platform/cdpipelines/dialogs/ManageStage/hooks/useFormContext.ts`
- [ ] `modules/platform/cdpipelines/pages/create/components/CreateCDPipelineWizard/hooks/useDefaultValues.ts`
- [ ] `modules/platform/cdpipelines/pages/details/components/EnvironmentCard/hooks/useInfoColumns.tsx`
- [ ] `modules/platform/cdpipelines/pages/details/components/StageListFilter/hooks/useStageFilter.ts`
- [ ] `modules/platform/cdpipelines/pages/details/hooks/useTabs.tsx`
- [ ] `modules/platform/cdpipelines/pages/list/components/CDPipelineFilter/hooks/useCDPipelineFilter.ts`
- [ ] `modules/platform/cdpipelines/pages/list/components/CDPipelineList/hooks/useColumns.tsx`
- [ ] `modules/platform/cdpipelines/pages/list/filter/hooks/useCDPipelineFilter.ts`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/ConfigurationTable/hooks/useColumns.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/PreviewTable/hooks/useColumns.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/hooks/useApplicationsForm.ts`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/hooks/useButtonsEnabled.ts`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/hooks/useSelection.ts`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/hooks/useTypedFormContext.ts`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Overview/hooks/useInfoColumns.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/hooks/usePageTabs.tsx`
- [ ] `modules/platform/cdpipelines/pages/stages/create/components/CreateStageWizard/hooks/useDefaultValues.ts`
- [ ] `modules/platform/codebases/components/CodebaseActionsMenu/hooks/useDeletionConflictItem.ts`
- [ ] `modules/platform/codebases/components/CodebaseBranchActionsMenu/hooks/useDeletionConflictItem.ts`
- [ ] `modules/platform/codebases/components/form-fields/AdvancedJiraMapping/hooks/useHandleAddMappingRow.ts`
- [ ] `modules/platform/codebases/components/form-fields/AdvancedJiraMapping/hooks/useHandleDeleteMappingRow.ts`
- [ ] `modules/platform/codebases/components/form-fields/AdvancedJiraMapping/hooks/useOnChangeJiraPattern.ts`
- [ ] `modules/platform/codebases/components/form-fields/AdvancedJiraMapping/hooks/useUpdateJiraMapping.ts`
- [ ] `modules/platform/codebases/dialogs/EditCodebase/hooks/useDefaultValues.ts`
- [ ] `modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Create/hooks/useDefaultValues.ts`
- [ ] `modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Edit/hooks/useDefaultValues.ts`
- [ ] `modules/platform/codebases/dialogs/ManageCodebaseBranch/hooks/useFormContext.ts`
- [ ] `modules/platform/codebases/pages/create/components/CreateCodebaseWizard/hooks/useDefaultValues.ts`
- [ ] `modules/platform/codebases/pages/create/components/CreateCodebaseWizard/hooks/useTypedFormContext.ts`
- [ ] `modules/platform/codebases/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [ ] `modules/platform/codebases/pages/details/hooks/usePageTabs.tsx`
- [ ] `modules/platform/codebases/pages/list/components/CodebaseFilter/hooks/useFilter.tsx`
- [ ] `modules/platform/codebases/pages/list/components/ComponentList/hooks/useColumns.tsx`
- [ ] `modules/platform/codebases/pages/list/components/ComponentList/hooks/useSelection.ts`
- [ ] `modules/platform/configuration/modules/argocd/components/ManageArgoCD/hooks/useFormsContext.ts`
- [ ] `modules/platform/configuration/modules/argocd/components/ManageArgoCD/hooks/useQuickLinkEditForm.ts`
- [ ] `modules/platform/configuration/modules/argocd/components/ManageArgoCD/hooks/useSecretCreateForm.ts`
- [ ] `modules/platform/configuration/modules/argocd/components/ManageArgoCD/hooks/useSecretEditForm.ts`
- [ ] `modules/platform/configuration/modules/chat-assistant/components/ManageChatAssistant/hooks/useFormsContext.ts`
- [ ] `modules/platform/configuration/modules/chat-assistant/components/ManageChatAssistant/hooks/useQuickLinkEditForm.ts`
- [ ] `modules/platform/configuration/modules/chat-assistant/components/ManageChatAssistant/hooks/useSecretCreateForm.ts`
- [ ] `modules/platform/configuration/modules/chat-assistant/components/ManageChatAssistant/hooks/useSecretEditForm.ts`
- [ ] `modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/Edit/components/FormActions/hooks/useConflictedStage.ts`
- [ ] `modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/Edit/hooks/useDefaultValues.ts`
- [ ] `modules/platform/configuration/modules/codemie/components/ManageCodeMie/hooks/useCodemieCreateForm.ts`
- [ ] `modules/platform/configuration/modules/codemie/components/ManageCodeMie/hooks/useCodemieEditForm.ts`

_... and 91 more platform hooks_

---

## 🟡 MEDIUM PRIORITY: State Management (4 files)

Zustand stores managing application state.

- [ ] `modules/platform/cdpipelines/pages/create/components/CreateCDPipelineWizard/store.ts`
- [ ] `modules/platform/cdpipelines/pages/stage-details/store.ts`
- [ ] `modules/platform/cdpipelines/pages/stages/create/components/CreateStageWizard/store.ts`
- [ ] `modules/platform/codebases/pages/create/components/CreateCodebaseWizard/store.ts`

---

## 🟡 MEDIUM PRIORITY: Components with Logic (107 files)

React components with business logic (not simple UI components).

**Note:** Components should primarily be tested with React Testing Library or Storybook.
Only unit test complex component logic if it's isolated into testable functions.

- [ ] `App.tsx`
- [ ] `core/auth/pages/login/components/TokenLoginDialog.tsx`
- [ ] `core/components/app-sidebar.tsx`
- [ ] `core/components/cluster-switcher.tsx`
- [ ] `core/components/form/Autocomplete.tsx`
- [ ] `core/components/form/NamespaceAutocomplete.tsx`
- [ ] `core/components/form/Select.tsx`
- [ ] `core/components/form/SelectField.tsx`
- [ ] `core/components/form/SwitchField.tsx`
- [ ] `core/components/form/TextField.tsx`
- [ ] `core/components/misc/LoadingWrapper.tsx`
- [ ] `core/components/nav-main.tsx`
- [ ] `core/components/nav-user.tsx`
- [ ] `core/components/sidebar/SidebarMenuContent.tsx`
- [ ] `core/components/sidebar/SidebarMenuItem.tsx`
- [ ] `core/components/sidebar/SidebarMenuItemWithHover.tsx`
- [ ] `core/components/sidebar/SidebarSubGroupMenuItem.tsx`
- [ ] `core/components/ui/LoadingProgressBar.tsx`
- [ ] `core/components/ui/LoadingSpinner.tsx`
- [ ] `core/components/ui/accordion.tsx`

_... and 87 more components_

<details>
<summary>View all components</summary>

- [ ] `core/components/ui/alert.tsx`
- [ ] `core/components/ui/avatar.tsx`
- [ ] `core/components/ui/badge.tsx`
- [ ] `core/components/ui/breadcrumb.tsx`
- [ ] `core/components/ui/button.tsx`
- [ ] `core/components/ui/card.tsx`
- [ ] `core/components/ui/checkbox-group-with-buttons.tsx`
- [ ] `core/components/ui/checkbox.tsx`
- [ ] `core/components/ui/chip.tsx`
- [ ] `core/components/ui/collapsible.tsx`
- [ ] `core/components/ui/combobox-multiple-with-input.tsx`
- [ ] `core/components/ui/combobox-with-input.tsx`
- [ ] `core/components/ui/combobox.tsx`
- [ ] `core/components/ui/command.tsx`
- [ ] `core/components/ui/dialog.tsx`
- [ ] `core/components/ui/dropdown-menu.tsx`
- [ ] `core/components/ui/form-field-group.tsx`
- [ ] `core/components/ui/form-field.tsx`
- [ ] `core/components/ui/input-editable.tsx`
- [ ] `core/components/ui/input-password.tsx`
- [ ] `core/components/ui/input.tsx`
- [ ] `core/components/ui/label.tsx`
- [ ] `core/components/ui/popover.tsx`
- [ ] `core/components/ui/progress.tsx`
- [ ] `core/components/ui/radio-group-with-buttons.tsx`
- [ ] `core/components/ui/radio-group.tsx`
- [ ] `core/components/ui/select.tsx`
- [ ] `core/components/ui/separator.tsx`
- [ ] `core/components/ui/sheet.tsx`
- [ ] `core/components/ui/sidebar.tsx`
- [ ] `core/components/ui/skeleton.tsx`
- [ ] `core/components/ui/stepper.tsx`
- [ ] `core/components/ui/switch.tsx`
- [ ] `core/components/ui/table-pagination.tsx`
- [ ] `core/components/ui/table.tsx`
- [ ] `core/components/ui/tabs.tsx`
- [ ] `core/components/ui/textarea-password.tsx`
- [ ] `core/components/ui/textarea.tsx`
- [ ] `core/components/ui/tile-radio-group.tsx`
- [ ] `core/components/ui/title-status.tsx`
- [ ] `core/components/ui/toggle-button-group.tsx`
- [ ] `core/components/ui/tooltip.tsx`
- [ ] `core/router/components/AppRouter.tsx`
- [ ] `core/router/components/RouterErrorComponent.tsx`
- [ ] `core/router/components/root.tsx`
- [ ] `main.tsx`
- [ ] `modules/platform/cdpipelines/dialogs/EditCDPipeline/components/FormActions.tsx`
- [ ] `modules/platform/cdpipelines/dialogs/EditCDPipeline/components/FormContent.tsx`
- [ ] `modules/platform/cdpipelines/dialogs/EditStage/components/FormActions.tsx`
- [ ] `modules/platform/cdpipelines/dialogs/EditStage/components/FormContent.tsx`
- [ ] `modules/platform/cdpipelines/pages/details/components/EnvironmentCard/components/ApplicationsList.tsx`
- [ ] `modules/platform/cdpipelines/pages/details/components/EnvironmentCard/components/CardActions.tsx`
- [ ] `modules/platform/cdpipelines/pages/details/components/EnvironmentCard/components/ExternalServices.tsx`
- [ ] `modules/platform/cdpipelines/pages/details/components/EnvironmentCard/components/Header.tsx`
- [ ] `modules/platform/cdpipelines/pages/details/components/EnvironmentCard/components/HealthSummary.tsx`
- [ ] `modules/platform/cdpipelines/pages/details/components/EnvironmentCard/components/InfoGrid.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionConfiguration.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionConfigurationHead.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionPreview.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionPreviewHead.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/Health.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/Ingress.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/IngressHead.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/Name.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/Pods.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/Sync.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/ValuesOverrideConfiguration.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/ValuesOverrideConfigurationHead.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/ValuesOverrideHead.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/ValuesOverridePreview.tsx`
- [ ] `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/ValuesOverridePreviewHead.tsx`
- [ ] `modules/platform/codebases/dialogs/EditCodebase/components/FormActions.tsx`
- [ ] `modules/platform/codebases/dialogs/EditCodebase/components/FormContent.tsx`
- [ ] `modules/platform/security/components/dependencytrack/DependencyTrackMetricsList/components/SeverityBadge.tsx`
- [ ] `modules/platform/security/pages/sast-project-details/components/IssuesSection/IssueFilters.tsx`
- [ ] `modules/platform/security/pages/sast-project-details/components/IssuesSection/IssueRow.tsx`
- [ ] `modules/platform/security/pages/sast-project-details/components/IssuesSection/IssuesTable.tsx`
- [ ] `modules/platform/security/pages/sast-project-details/components/MetricsGrid/MetricCard.tsx`
- [ ] `modules/platform/security/pages/sast-project-details/components/QualityGateDetails/ConditionsTable.tsx`
- [ ] `modules/platform/security/pages/sast-project-details/utils/severityConfig.tsx`
- [ ] `modules/platform/security/pages/sast/utils/ratings.tsx`
- [ ] `modules/platform/security/pages/sca-project-details/components/ProjectFindings/components/AnalysisStateBadge.tsx`
- [ ] `modules/platform/security/pages/sca-project-details/components/ProjectFindings/components/FindingDetail.tsx`
- [ ] `modules/platform/security/pages/sca-project-details/components/ProjectFindings/components/FindingRow.tsx`
- [ ] `modules/platform/security/pages/sca-project-details/components/ProjectFindings/components/SeverityBadge.tsx`
- [ ] `modules/platform/tekton/components/PipelineDiagram/components/PipelineTaskNode.tsx`
- [ ] `modules/platform/tekton/components/PipelineRunDiagram/components/PipelineRunTaskNode.tsx`

</details>

---

## 🟢 LOW PRIORITY: Config & Setup Files (3 files)

Configuration files - minimal testing value.

- [ ] `eslint.config.js`
- [ ] `vite.config.ts`
- [ ] `eslint.config.js`

---

## ✅ Files Already With Tests (29 files)

Great work! These files already have test coverage:

- ✅ `core/utils/createResourceAction/index.ts`
- ✅ `core/utils/format/capitalizeFirstLetter/index.ts`
- ✅ `core/utils/format/formatDateUTCToLocal/index.ts`
- ✅ `core/utils/getValidURLPattern/index.ts`
- ✅ `core/utils/mapEvery/index.ts`
- ✅ `core/utils/sortByName/index.ts`
- ✅ `k8s/api/groups/KRCI/Codebase/utils/icon-mappings/index.ts`
- ✅ `k8s/services/link-creation/argocd/index.ts`
- ✅ `k8s/services/link-creation/deptrack/index.ts`
- ✅ `k8s/services/link-creation/git/index.ts`
- ✅ `k8s/services/link-creation/logging/index.ts`
- ✅ `k8s/services/link-creation/monitoring/index.ts`
- ✅ `k8s/services/link-creation/sonar/index.ts`
- ✅ `modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/utils/createImageStreamTags/index.ts`
- ✅ `modules/platform/security/components/dependencytrack/DependencyTrackMetricsWidget/utils.ts`
- ✅ `clients/db-session-store/index.ts`
- ✅ `packages/trpc/src/clients/k8s/index.ts`
- ✅ `packages/trpc/src/clients/oidc/index.ts`
- ✅ `packages/trpc/src/procedures/protected/index.ts`
- ✅ `packages/trpc/src/procedures/public/index.ts`
- ✅ `packages/trpc/src/routers/auth/procedures/login/index.ts`
- ✅ `packages/trpc/src/routers/auth/procedures/loginCallback/index.ts`
- ✅ `packages/trpc/src/routers/auth/procedures/logout/index.ts`
- ✅ `packages/trpc/src/routers/auth/procedures/me/index.ts`
- ✅ `packages/trpc/src/routers/k8s/procedures/basic/apiVersions/index.ts`
- ✅ `packages/trpc/src/routers/k8s/procedures/basic/get/index.ts`
- ✅ `packages/trpc/src/routers/k8s/procedures/basic/list/index.ts`
- ✅ `packages/trpc/src/routers/k8s/procedures/permissions/index.ts`
- ✅ `packages/trpc/src/utils/getTokenExpirationTime/index.ts`

---

## 📝 Testing Guidelines

### Recommended Testing Strategy

1. **Start with High Priority Files**
   - Focus on utilities, services, and hooks
   - These have the most business logic and highest ROI

2. **Utilities Pattern**
   ```
   /utils/myUtil/
     ├── index.ts       ← Implementation
     └── index.test.ts  ← Tests
   ```

3. **Hooks Testing**
   - Use `@testing-library/react-hooks` for custom hooks
   - Test state changes, side effects, and edge cases

4. **Services Testing**
   - Mock external APIs
   - Test error handling and retry logic
   - Verify correct data transformation

5. **Components**
   - Use React Testing Library for integration tests
   - Consider Storybook for visual testing
   - Only unit test complex isolated logic

### Coverage Goals

| Phase | Target | Files to Test |
|-------|--------|---------------|
| **Phase 1** | 10% | ~45 high-priority files |
| **Phase 2** | 25% | ~112 files |
| **Phase 3** | 50% | ~224 files |
| **Phase 4** | 80% | ~358 files |

### Current Exclusions (Working Correctly)

Files excluded from coverage requirements:
- ✅ 557 `index.tsx` (React component exports)
- ✅ 165 `types.ts` (TypeScript type definitions)
- ✅ 75 `constants.ts` (Static configuration)
- ✅ 75 Route configuration files
- ✅ 35 Barrel export `index.ts` files

---

## 🚀 Quick Start

1. **Pick a file from High Priority sections**
2. **Create a test file**:
   ```bash
   # For utils
   touch apps/client/src/core/utils/myUtil/index.test.ts
   
   # For hooks
   touch apps/client/src/modules/platform/.../useMyHook.test.ts
   ```

3. **Run tests**:
   ```bash
   pnpm test:coverage
   ```

4. **Check this file and mark items complete** ✅

---

## 📈 Progress Tracking

Update this section as you add tests:

- [x] Initial coverage configuration
- [ ] 10% coverage milestone
- [ ] 25% coverage milestone
- [ ] 50% coverage milestone
- [ ] 80% coverage milestone

---

**Last Updated:** 2026-01-15
**Vitest Config:** `/vitest.config.ts`
**Coverage Report:** `coverage/index.html`

---

## 🎨 Storybook Testing Strategy

### Component Testing
All React components (`.tsx` files) are excluded from Vitest coverage because they should be tested with **Storybook** or **React Testing Library**.

**152 component files excluded:**
- All `.tsx` files are excluded from unit test coverage
- Test these with Storybook for visual testing
- Use React Testing Library for integration tests

### Storybook File Patterns
The following patterns are recognized and excluded from coverage:
- `*.stories.tsx` - Storybook story files
- `*.stories.ts` - TypeScript story files  
- `*.story.tsx` - Alternative story naming
- `*.story.ts` - Alternative TS story naming

### When to Create Stories
Create Storybook stories for:
- Reusable UI components
- Form components with complex states
- Components with multiple visual variants
- Interactive components (buttons, modals, etc.)

---

## 🪝 Hook Testing Strategy

### Simple Hooks - Excluded from Coverage (45 files)

These hooks return UI configuration and don't contain testable business logic:

| Hook Pattern | Count | Purpose | Excluded? |
|--------------|-------|---------|-----------|
| `useTabs.tsx` | 11 | Tab configuration arrays | ✅ Yes |
| `useFilter.tsx` | 6 | Filter hook wrappers | ✅ Yes |
| `useColumns.tsx` | 13 | Table column configurations | ✅ Yes |
| `useDefaultValues.ts` | 15 | Form default value mappings | ✅ Yes |

**Example of excluded hook:**
```typescript
// useTabs.tsx - just returns config, no logic to test
export const useTabs = (): Tab[] => {
  return [
    { id: 'tab1', label: 'Tab 1', component: <Component1 /> },
    { id: 'tab2', label: 'Tab 2', component: <Component2 /> },
  ];
};
```

### Complex Hooks - Included in Coverage (~114 files)

These hooks contain business logic and **need unit tests**:

| Hook Type | Example | Why Test? |
|-----------|---------|-----------|
| State Management | `useTableSettings.ts` | localStorage interactions |
| Data Fetching | `usePagination.ts` | API calls, state management |
| Form Logic | `useValidation.ts` | Complex validation rules |
| Calculations | `useMetricsData.ts` | Data transformations |

**Example of hook that needs tests:**
```typescript
// useTableSettings.ts - has logic, needs tests!
export const useTableSettings = (tableId: string) => {
  const loadSettings = (): SavedTableSettings => {
    return LOCAL_STORAGE_SERVICE.getItem(LS_KEY_TABLE_SETTINGS)?.[tableId] ?? {};
  };

  const saveSettings = (settings: SavedTableSettings) => {
    const currentSettings = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_TABLE_SETTINGS) ?? {};
    LOCAL_STORAGE_SERVICE.setItem(LS_KEY_TABLE_SETTINGS, {
      ...currentSettings,
      [tableId]: settings,
    });
  };

  return { loadSettings, saveSettings };
};
```


---

## 📊 Updated Statistics (2026-01-15)

After excluding TSX components and simple hooks:

- **Total files tracked: 280** (down from 447)
- **Excluded: 167 additional files**
  - 152 TSX component files → Test with Storybook
  - 45 simple hooks → UI configuration only

This brings the focus to **pure business logic** that needs unit testing.