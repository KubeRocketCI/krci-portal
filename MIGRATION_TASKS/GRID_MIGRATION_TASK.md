# Grid Component Migration Task

## Summary

Migrate MUI `Grid` components to plain HTML `<div>` elements with Tailwind CSS Grid utilities.

## Transformation

### Before (MUI)
```tsx
import { useTheme } from "@mui/material";

<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    Content 1
  </Grid>
  <Grid item xs={12} md={6}>
    Content 2
  </Grid>
</Grid>
```

### After (Plain HTML + Tailwind)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
  <div>
    Content 1
  </div>
  <div>
    Content 2
  </div>
</div>
```

## Common Patterns

### Basic Grid Layout
```tsx
// MUI
<Grid container>
  <Grid item xs={12}>Item</Grid>
</Grid>

// Tailwind
<div className="grid grid-cols-1">
  <div>Item</div>
</div>
```

### Responsive Grid
```tsx
// MUI
<Grid container>
  <Grid item xs={12} md={6} lg={4}>Item</Grid>
</Grid>

// Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>Item</div>
</div>
```

### Grid with Spacing
```tsx
// MUI
<Grid container spacing={2} rowSpacing={1} columnSpacing={3}>
  <Grid item xs={12} md={6}>Item 1</Grid>
  <Grid item xs={12} md={6}>Item 2</Grid>
</Grid>

// Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Grid Item Spanning
```tsx
// MUI
<Grid container>
  <Grid item xs={12} md={6}>Half</Grid>
  <Grid item xs={12} md={12}>Full</Grid>
</Grid>

// Tailwind
<div className="grid grid-cols-1 md:grid-cols-2">
  <div className="md:col-span-1">Half</div>
  <div className="md:col-span-2">Full</div>
</div>
```

## Key Conversions

| MUI Prop | Tailwind Class | Notes |
|----------|---------------|-------|
| `container` | `grid` | Use `grid` for container |
| `item` | (none) | Regular div child |
| `xs={12}` | `grid-cols-1` | 12/12 = 1 column |
| `xs={6}` | `grid-cols-2` | 12/6 = 2 columns |
| `xs={4}` | `grid-cols-3` | 12/4 = 3 columns |
| `xs={3}` | `grid-cols-4` | 12/3 = 4 columns |
| `md={6}` | `md:grid-cols-2` | Responsive breakpoint |
| `spacing={2}` | `gap-2` | Gap in 4px units |
| `rowSpacing={1}` | `gap-y-1` | Vertical gap |
| `columnSpacing={2}` | `gap-x-2` | Horizontal gap |
| `item xs={6}` | `col-span-1 md:col-span-1` | Explicit column span |

## Rules

1. Remove Grid import from `@mui/material`
2. Replace `Grid container` with `div` using `grid` class
3. Replace `Grid item` with plain `div`
4. Convert xs/md/lg/xl breakpoints to Tailwind breakpoints
5. Map MUI spacing (8px units) to Tailwind gap (4px units): spacing={2} → gap-2
6. Keep all existing props and children
7. Use responsive classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
8. Use Tailwind's gap utilities for spacing
9. No manual pixel values or rem values

## Files to Migrate

Total: 110 files (96 originally discovered + 14 additional files found with Grid components)

- [x] `apps/client/src/core/components/DataGrid/index.tsx` (already migrated - no Grid import)
- [x] `apps/client/src/core/components/InfoColumns/index.tsx`
- [x] `apps/client/src/core/components/PageWrapper/index.tsx`
- [x] `apps/client/src/core/components/QuickLink/index.tsx` (no Grid import)
- [x] `apps/client/src/core/components/ResourceIconLink/index.tsx` (no Grid import)
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/fields/Applications/components/ApplicationRow/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/fields/Applications/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/Create/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/Edit/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/fields/QualityGates/components/QualityGateRow/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/fields/QualityGates/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/details/components/HeaderActions/index.tsx` (already migrated - no Grid import)
- [x] `apps/client/src/modules/platform/cdpipelines/pages/details/components/StageList/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/details/components/StageListFilter/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionPreview.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Overview/hooks/useInfoColumns.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Inner/components/Form/components/Advanced/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/fields/AdvancedJiraMapping/components/AdvancedJiraMappingRow/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/fields/AdvancedJiraMapping/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/fields/CodemieIntegration/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/fields/CodebaseVersioning/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/fields/JiraServerIntegration/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Edit/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Create/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Edit/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/fields/BranchName/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/fields/BranchVersion/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/fields/DefaultBranchVersion/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/fields/FromCommit/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/fields/ReleaseBranchName/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/components/BranchListItem/components/Details/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/components/BranchListItem/components/Summary/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/Overview/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/list/components/ComponentList/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/argocd/components/ManageArgoCD/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/argocd/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/chat-assistant/components/ManageChatAssistant/components/QuickLink/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/chat-assistant/components/ManageChatAssistant/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/chat-assistant/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/Create/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/Create/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/Edit/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/Edit/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/components/ManageClusterSecret/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/Applications/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/Codemie/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/CodemieProjectSettings/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/ManageCodeMie/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/defectdojo/components/ManageDefectDojo/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/defectdojo/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/dependency-track/components/ManageDependencyTrack/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/dependency-track/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitops/components/ManageGitOps/components/Create/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitops/components/ManageGitOps/components/FormActions/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitops/components/ManageGitOps/components/View/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitops/components/ManageGitOps/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitops/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitservers/components/ManageGitServer/components/Credentials/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitservers/components/ManageGitServer/components/GitServer/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitservers/components/ManageGitServer/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitservers/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/jira/components/ManageJiraServer/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/jira/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/nexus/components/ManageNexus/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/nexus/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink/components/Create/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink/components/Edit/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink/components/fields/Icon/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/components/ConfigMap/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/components/PullAccount/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/components/PushAccount/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/sonar/components/ManageSonar/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/sonar/view.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/CreateCodebaseFromTemplate/components/fields/CodebaseVersioning/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/CreateCodebaseFromTemplate/components/Form/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/CreateCodebaseFromTemplate/components/Preview/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/TemplatesGrid/components/TemplateCard/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/TemplatesGrid/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/TemplatesTable/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/QuickLinkList/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/view.tsx`
- [x] `apps/client/src/modules/platform/pipelines/dialogs/PipelineGraph/index.tsx`
- [x] `apps/client/src/modules/platform/pipelines/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/dialogs/PipelineRunGraph/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Details/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/ReserveLogs/components/LogsByTask/index.tsx`
- [x] `apps/client/src/modules/platform/tasks/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [x] `apps/client/src/core/providers/Form/components/MainRadioGroup/types.ts`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Inner/components/Form/components/Info/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/TemplatesTable/index.tsx` (No Grid - only Grid3x2 icon from lucide-react)
- [x] `apps/client/src/modules/platform/configuration/modules/sonar/components/ManageSonar/components/QuickLink/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/nexus/components/ManageNexus/components/QuickLink/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/defectdojo/components/ManageDefectDojo/components/QuickLink/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/chat-assistant/components/ManageChatAssistant/components/QuickLink/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/dependency-track/components/ManageDependencyTrack/components/QuickLink/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/ManageCodeMie/components/QuickLink/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/argocd/components/ManageArgoCD/components/QuickLink/index.tsx`
- [x] `apps/client/src/core/components/dialogs/ConfirmResourcesUpdates/index.tsx`
- [x] `apps/client/src/core/components/DeleteKubeObject/index.tsx`
- [x] `apps/client/src/core/components/Confirm/index.tsx`
- [x] `apps/client/src/core/providers/Form/components/MainRadioGroup/index.tsx`
- [x] `apps/client/src/core/providers/Form/components/FormRadioGroup/index.tsx`

---

## Checklist

- [x] Discovery complete (96 files found initially + 14 additional files with Grid components = 110 total)
- [x] Migration complete (110/110 files completed - 100% complete) ✅

---

## Notes

_Issues encountered:_

