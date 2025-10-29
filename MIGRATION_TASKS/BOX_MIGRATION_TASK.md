# Box → `<div>` + Tailwind

**Status:** [ ] Not Started | [x] In Progress | [x] Complete  
**Estimated:** ~150 files

---

## Transformation

**Remove MUI Box, use plain div + Tailwind classes:**

```tsx
// BEFORE
import { Box } from "@mui/material";
<Box sx={{ display: 'flex', padding: 2, gap: 2 }}>
  <Box sx={{ flex: 1 }}>Content</Box>
</Box>

// AFTER
<div className="flex p-4 gap-4">
  <div className="flex-1">Content</div>
</div>
```

**Common Patterns:**
- `sx={{ display: 'flex' }}` → `className="flex"`
- `sx={{ padding: 2 }}` → `className="p-2"`
- `sx={{ margin: 2 }}` → `className="m-2"`
- `sx={{ gap: 2 }}` → `className="gap-2"`
- `sx={{ flex: 1 }}` → `className="flex-1"`
- `sx={{ flexDirection: 'column' }}` → `className="flex-col"`
- `sx={{ alignItems: 'center' }}` → `className="items-center"`
- `sx={{ justifyContent: 'space-between' }}` → `className="justify-between"`

**Critical Rules:**
- ❌ **NO style attributes** - Use Tailwind classes only
- ❌ **NO pixels or rem manually** - Use Tailwind's relative units
- **Spacing calculation:** Tailwind base unit = 4px (1 unit = 4px)
  - `120px` = 120 ÷ 4 = **pb-30**
  - `16px` = 16 ÷ 4 = **mt-4**
  - `theme.typography.pxToRem(120)` = **pb-30**
- Convert `pxToRem` values: divide by 4 to get the Tailwind number

---

## Files to Migrate

**Total files found:** 82 files

- [x] `apps/client/src/core/auth/pages/login/view.tsx`
- [x] `apps/client/src/core/components/BorderedSection/index.tsx`
- [x] `apps/client/src/core/components/CopyButton/index.tsx`
- [x] `apps/client/src/core/components/DataGrid/index.tsx`
- [x] `apps/client/src/core/components/EmptyList/index.tsx`
- [x] `apps/client/src/core/components/ErrorContent/index.tsx`
- [x] `apps/client/src/core/components/HorizontalScrollContainer/index.tsx`
- [x] `apps/client/src/core/components/Namespaces/index.tsx`
- [x] `apps/client/src/core/components/PageWrapper/index.tsx`
- [x] `apps/client/src/core/components/PercentageCircleChart/index.tsx`
- [x] `apps/client/src/core/components/PodExecTerminal/index.tsx`
- [x] `apps/client/src/core/components/PodLogsTerminal/index.tsx`
- [x] `apps/client/src/core/components/ResponsiveChips/index.tsx`
- [x] `apps/client/src/core/components/Section/index.tsx`
- [x] `apps/client/src/core/components/TabSection/index.tsx`
- [x] `apps/client/src/core/components/Table/index.tsx`
- [x] `apps/client/src/core/components/Table/components/TableBody/components/TableRow/index.tsx`
- [x] `apps/client/src/core/components/Table/components/TableHead/index.tsx`
- [x] `apps/client/src/core/components/Terminal/index.tsx`
- [x] `apps/client/src/core/components/TextWithTooltip/index.tsx`
- [x] `apps/client/src/core/components/TooltipWithLinkList/index.tsx`
- [x] `apps/client/src/core/components/dialogs/ConfirmResourcesUpdates/index.tsx`
- [x] `apps/client/src/core/components/form/Select.tsx`
- [x] `apps/client/src/core/providers/Form/components/FormAutocomplete/index.tsx`
- [x] `apps/client/src/core/providers/Form/components/FormControlLabelWithTooltip/index.tsx`
- [x] `apps/client/src/core/providers/Form/components/FormSelect/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/Create/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/Create/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/Edit/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/Create/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/Create/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/Edit/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/details/view.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/list/components/CDPipelineList/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/PreviewTable/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/ValuesOverrideSwitch/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionConfiguration.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionPreview.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/ValuesOverrideConfiguration.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/HeaderActions/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Details/components/TabContent/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/components/CodebaseActionsMenu/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Inner/components/Form/components/Info/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Inner/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Inner/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Selection/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Edit/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Create/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Edit/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/fields/BuildPipeline/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/fields/ReviewPipeline/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/components/BranchListItem/components/Summary/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/components/BranchListItem/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/DeeptrackVulnerabilities/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/hooks/usePageTabs.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/list/components/ComponentList/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/components/ConfigurationPageContent/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/fields/ClusterType/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitops/components/ManageGitOps/components/Create/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink/components/Create/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink/components/Edit/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/components/Actions/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/CreateCodebaseFromTemplate/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/CreateCodebaseFromTemplate/components/Preview/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/Filter/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/TemplatesGrid/components/TemplateCard/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/AppVersion/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/AppVersion/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/LegendListItem/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/UserWidgetsRenderer/index.tsx`
- [x] `apps/client/src/modules/platform/pipelines/components/PipelineDiagram/components/PipelineTaskNode.tsx`
- [x] `apps/client/src/modules/platform/pipelines/components/PipelineDiagram/index.tsx`
- [x] `apps/client/src/modules/platform/pipelines/pages/details/hooks/useTabs.tsx`
- [x] `apps/client/src/modules/platform/pipelines/pages/list/components/PipelineList/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunDiagram/components/PipelineRunTaskNode.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunDiagram/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunList/components/Filter/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunList/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Details/components/TabContent/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/ReserveLogs/hooks/useTabs.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/hooks/useTabs.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/list/hooks/useTabs.tsx`
- [x] `apps/client/src/modules/platform/tasks/pages/details/hooks/useTabs.tsx`

---

## Checklist

- [x] Discovery complete (82 files found and listed above)
- [x] Migration complete (82/82 files migrated)

---

## Notes

_Issues encountered:_
