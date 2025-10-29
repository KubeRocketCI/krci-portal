# Typography → Semantic HTML + Tailwind

**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete  
**Estimated:** ~105 files

---

## Transformation

**Remove MUI Typography, use semantic HTML + Tailwind classes:**

```tsx
// BEFORE
import { Typography } from "@mui/material";
<Typography variant="h1">Heading</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="caption" color="primary">Small text</Typography>
<Typography fontSize={28} fontWeight={600} color="text.secondary">Custom size</Typography>

// AFTER
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base">Body text</p>
<span className="text-xs text-foreground">Small text</span>
<h2 className="text-3xl font-semibold text-muted-foreground">Custom size</h2>
```

**⚠️ Important:** In MUI Typography, `color="primary"` refers to `theme.palette.text.primary` (normal body text color), NOT `theme.palette.primary.main` (blue accent). This maps to Tailwind's `text-foreground`, not `text-primary`. The `text-primary` class in Tailwind is the blue accent color.

**Common Patterns:**

### Variants → Semantic HTML + Tailwind
- `variant="h1"` → `<h1 className="text-4xl font-bold">`
- `variant="h2"` → `<h2 className="text-3xl font-semibold">`
- `variant="h3"` → `<h3 className="text-2xl font-semibold">`
- `variant="h4"` → `<h4 className="text-xl font-semibold">`
- `variant="h5"` → `<h5 className="text-lg font-medium">`
- `variant="h6"` → `<h6 className="text-base font-medium">`
- `variant="subtitle1"` → `<p className="text-lg">`
- `variant="subtitle2"` → `<p className="text-sm font-medium">`
- `variant="body1"` → `<p className="text-base">`
- `variant="body2"` → `<p className="text-sm">`
- `variant="caption"` → `<span className="text-xs">`
- `variant="overline"` → `<span className="text-xs uppercase tracking-wider">`

### Color Props

**⚠️ CRITICAL: Understanding MUI Typography Color Props**

**MUI Typography has special semantics for color props:**
- For Typography component, `color="primary"` refers to `theme.palette.text.primary` (normal body text), NOT `theme.palette.primary.main` (blue accent)
- This is different from other MUI components where `color="primary"` means `theme.palette.primary.main`
- See [MUI Typography API](https://mui.com/material-ui/api/typography/#typography-prop-color) for reference

**Tailwind Color Classes (registered in @theme inline section):**
- `text-foreground` → uses `--color-foreground` - **Normal body text color** (equivalent to MUI `theme.palette.text.primary`)
- `text-primary` → uses `--color-primary` (maps to `--primary` = #0078d4) - **Blue accent color** (equivalent to MUI `theme.palette.primary.main`)
- `text-muted-foreground` → uses `--color-muted-foreground` - **Muted/secondary text** (equivalent to MUI `theme.palette.text.secondary`)
- `text-primary-foreground` → uses `--color-primary-foreground`
- `text-secondary` → uses `--color-secondary`
- `text-secondary-foreground` → uses `--color-secondary-foreground`
- `text-muted` → uses `--color-muted`
- `text-accent` → uses `--color-accent`
- `text-accent-foreground` → uses `--color-accent-foreground`
- `text-destructive` → uses `--color-destructive` - **Error/warning color** (equivalent to MUI `theme.palette.error.main`)
- `text-destructive-foreground` → uses `--color-destructive-foreground`
- `text-background` → uses `--color-background`
- `text-border` → uses `--color-border`

**MUI Typography Color → Tailwind Color Mapping:**

| MUI Typography Color | MUI Theme Path | Tailwind Class | Description |
|---------------------|----------------|----------------|-------------|
| `color="primary"` | `theme.palette.text.primary` | `text-foreground` | Normal body text color |
| `color="text.primary"` | `theme.palette.text.primary` | `text-foreground` | Normal body text color (explicit) |
| `color="secondary"` | `theme.palette.text.secondary` | `text-muted-foreground` | Muted/secondary text |
| `color="text.secondary"` | `theme.palette.text.secondary` | `text-muted-foreground` | Muted/secondary text (explicit) |
| `color="error"` | `theme.palette.error.main` | `text-destructive` | Error/warning color |
| `color="inherit"` | Inherited from parent | `text-inherit` | Inherited color |

**❌ COMMON MISTAKE:**
```tsx
// WRONG - This makes text BLUE when it should be normal text
<Typography color="primary">Normal text</Typography>
// ❌ WRONG: className="text-primary"  ← Makes text BLUE!

// CORRECT - This is normal body text color
<Typography color="primary">Normal text</Typography>
// ✅ CORRECT: className="text-foreground"  ← Normal text color
```

**Key Points:**
- In Typography: `color="primary"` = `text.primary` = normal body text → Use `text-foreground`
- `text-primary` in Tailwind = blue accent color (NOT for normal text)
- Default text color in Tailwind = `text-foreground` (maps to MUI `theme.palette.text.primary`)

**Critical:** ❌ **NO style attributes with MUI CSS variables** - Always use Tailwind classes for colors. Use only colors that are registered in the Tailwind theme (`@theme inline` section). If MUI color doesn't have a direct Tailwind equivalent, use the closest semantic color available in the theme.

### Font Properties
- `fontWeight={400}` → `font-normal`
- `fontWeight={500}` → `font-medium`
- `fontWeight={600}` → `font-semibold`
- `fontWeight={700}` → `font-bold`
- `fontSize={16}` → `text-base` (16px)
- `fontSize={20}` → `text-xl` (20px)
- `fontSize={24}` → `text-2xl` (24px)
- `fontSize={28}` → `text-3xl` (30px, closest match)
- `fontSize={32}` → `text-3xl` (30px) or `text-4xl` (36px, closest to 32px)
- `fontSize={36}` → `text-4xl` (36px)

**Font Size Calculation Guide:**
- Divide pixel value by 4px base unit to get Tailwind units
- Find closest standard Tailwind text size class (round to nearest)
- **Standard Tailwind text sizes:**
  - `text-xs` = 0.75rem (12px)
  - `text-sm` = 0.875rem (14px)
  - `text-base` = 1rem (16px)
  - `text-lg` = 1.125rem (18px)
  - `text-xl` = 1.25rem (20px)
  - `text-2xl` = 1.5rem (24px)
  - `text-3xl` = 1.875rem (30px)
  - `text-4xl` = 2.25rem (36px)
  - `text-5xl` = 3rem (48px)
  - `text-6xl` = 3.75rem (60px)
- **Examples:**
  - `13px` → closest is `text-sm` (14px, difference: 1px)
  - `14px` → `text-sm` (14px, exact match)
  - `15px` → closest is `text-base` (16px, difference: 1px)
  - `16px` → `text-base` (16px, exact match)
  - `28px` → closest is `text-3xl` (30px, difference: 2px)
  - `32px` → closest is `text-4xl` (36px, difference: 4px) or `text-3xl` (30px, difference: 2px)
  - `theme.typography.pxToRem(32)` → 32px → `text-3xl` (30px, closest)

### Text Alignment
- `textAlign="center"` → `text-center`
- `textAlign="left"` → `text-left`
- `textAlign="right"` → `text-right`

### Other Properties
- `component="span"` → Use `<span>` instead of default `<p>`
- `component="div"` → Use `<div>` instead
- `sx={{ mt: 0.5 }}` → `mt-1`
- `sx={{ display: "block" }}` → `block`
- `sx={{ fontStyle: "italic" }}` → `italic`

**Critical Rules:**
- ✅ **Use semantic HTML** - `<h1>`, `<h2>`, `<p>`, `<span>` based on content type
- ✅ **Use standard Tailwind classes ONLY** - No arbitrary values like `text-[13px]` or `text-[28px]`
- ✅ **Calculate closest match for font sizes**:
  - Divide pixel value by 4px base unit to find Tailwind units
  - Choose closest standard class: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), etc.
  - Examples: 13px → `text-sm` (14px), 15px → `text-base` (16px), 28px → `text-3xl` (30px)
- ✅ **Use Tailwind color classes ONLY** - No MUI CSS variables in style attributes
- ✅ **Map MUI Typography colors correctly (CRITICAL for Typography component):**
  - ⚠️ **In Typography:** `color="primary"` → `text-foreground` (NOT `text-primary`!)
  - ⚠️ **In Typography:** `color="primary"` maps to `theme.palette.text.primary` (normal text), not `theme.palette.primary.main` (blue accent)
  - `color="text.primary"` → `text-foreground` (explicit form, same as `color="primary"`)
  - `color="secondary"` → `text-muted-foreground` (NOT `text-secondary`)
  - `color="text.secondary"` → `text-muted-foreground` (explicit form, same as `color="secondary"`)
  - `color="error"` → `text-destructive`
  - `color="inherit"` → `text-inherit`
- ⚠️ **Remember:** `text-primary` in Tailwind = blue accent color (for buttons, links, etc.), NOT for Typography text color
- ⚠️ **Component prop** - Replace with appropriate semantic HTML element
- ❌ **NO style attributes** - **ALL styling must use Tailwind classes ONLY**
  - ❌ NO `style={{ marginRight: "1.25rem" }}` → ✅ Use `className="mr-5"` (20px ÷ 4 = 5)
  - ❌ NO `style={{ paddingRight: theme.typography.pxToRem(16) }}` → ✅ Use `className="pr-4"` (16px ÷ 4 = 4)
  - ❌ NO `style={{ color: "#596D80" }}` → ✅ Use semantic color class like `text-muted-foreground`
  - ❌ NO `style={{ minWidth: 0 }}` → ✅ Use `min-w-0`
  - ❌ NO `style={{ width: "100%" }}` → ✅ Use `w-full`
  - **Calculation rule:** Convert px/rem values: divide by 4px base unit, round to nearest integer for Tailwind units
  - **If value cannot be divided evenly by 4, round to closest multiple of 4:**
    - 5px → 4px → `mr-1`, `pr-1`, etc. (use closest standard Tailwind class)
    - 20px (1.25rem) → 20px ÷ 4 = 5 → `mr-5`, `pr-5`, etc.
    - 16px → 16px ÷ 4 = 4 → `mr-4`, `pr-4`, etc.
- ❌ **NO arbitrary pixel values** - Always use standard Tailwind text size classes
- ❌ **NO MUI CSS variables in style attributes** - Use Tailwind classes for all colors
- ❌ **NO inline style attributes** - ALL styling via Tailwind classes
- ❌ **NO Typography imports** - Remove after migration

---

## Files to Migrate

**Total files found:** 105 files

- [x] `apps/client/src/modules/platform/pipelines/components/PipelineDiagram/components/PipelineTaskNode.tsx`
- [x] `apps/client/src/core/providers/Form/components/FormTextFieldEncoded/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Overview/hooks/useInfoColumns.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/ReserveLogs/components/LogsByTask/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Selection/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/details/components/StageList/components/Stage/components/ApplicationCard/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/AddNewWidget/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/Success/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/columns/DeployedVersionConfigurationHead.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Edit/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebaseBranch/components/Create/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Edit/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/Edit/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/Create/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/Edit/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/Create/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/ReserveLogs/index.tsx`
- [x] `apps/client/src/core/providers/Form/components/MainRadioGroup/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Inner/components/Form/components/Info/index.tsx`
- [x] `apps/client/src/core/components/Confirm/index.tsx`
- [x] `apps/client/src/core/components/dialogs/ConfirmResourcesUpdates/index.tsx`
- [x] `apps/client/src/core/components/DeleteKubeObject/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/Applications/index.tsx`
- [x] `apps/client/src/modules/platform/pipelines/dialogs/PipelineGraph/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/dialogs/PipelineRunGraph/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/ManageCodeMie/components/CodemieSecret/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitservers/components/ManageGitServer/components/Credentials/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/components/PullAccount/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/components/PushAccount/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/components/ManageRegistry/components/ServiceAccount/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/CreateCodebaseFromTemplate/components/Preview/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/GitLabBuildWithParams/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/Codemie/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/TemplatesGrid/components/TemplateCard/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/codemie/components/CodemieProjectSettings/index.tsx`
- [x] `apps/client/src/modules/platform/pipelines/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/sonar/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/registry/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/nexus/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/jira/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitservers/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/gitops/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/dependency-track/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/defectdojo/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/chat-assistant/view.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/argocd/view.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/Overview/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/list/components/ComponentList/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/Overview/hooks/useInfoRows.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/components/BranchListItem/components/Summary/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/components/BranchListItem/components/Details/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageStage/components/fields/QualityGates/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/dialogs/ManageCDPipeline/components/fields/Applications/index.tsx`
- [x] `apps/client/src/core/components/PageWrapper/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/BranchList/index.tsx`
- [x] `apps/client/src/core/components/InfoColumns/index.tsx`
- [x] `apps/client/src/modules/platform/tasks/pages/details/view.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Details/components/TaskRunStepWrapper/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Details/components/TaskRunWrapper/components/CustomTaskRun/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Details/components/TaskRunWrapper/components/TaskRun/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/components/Details/components/MenuAccordion/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunList/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/pipelines/pages/details/view.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/QuickLinkList/components/AddNewQuickLinkCard/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/AppVersion/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/CreateCodebaseFromTemplate/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink/components/Edit/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink/components/Create/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/components/ConfigurationPageContent/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/DeeptrackVulnerabilities/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/SonarQubeMetrics/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/list/components/ComponentList/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/SonarQubeMetrics/components/MetricsItem/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/dialogs/ManageCodebase/components/Create/components/Inner/components/DialogHeader/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Variables/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Applications/components/PreviewTable/index.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/list/components/CDPipelineList/hooks/useColumns.tsx`
- [x] `apps/client/src/modules/platform/cdpipelines/pages/details/components/StageList/components/Stage/index.tsx`
- [x] `apps/client/src/core/components/NoDataWidgetWrapper/index.tsx`
- [x] `apps/client/src/core/components/PercentageCircleChart/index.tsx`
- [x] `apps/client/src/core/components/Table/components/TableHead/index.tsx`
- [x] `apps/client/src/core/components/Section/index.tsx`
- [x] `apps/client/src/core/components/TabSection/index.tsx`
- [x] `apps/client/src/core/components/ErrorContent/index.tsx`
- [x] `apps/client/src/core/components/EmptyList/index.tsx`
- [x] `apps/client/src/core/components/BorderedSection/index.tsx`
- [x] `apps/client/src/modules/platform/overview/pages/details/components/LegendListItem/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunList/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunDiagram/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/components/PipelineRunDiagram/components/PipelineRunTaskNode.tsx`
- [x] `apps/client/src/modules/platform/pipelines/components/PipelineDiagram/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/components/CodebaseActionsMenu/index.tsx`
- [x] `apps/client/src/modules/platform/pipelines/dialogs/PipelineGraph/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/dialogs/PipelineRunGraph/index.tsx`
- [x] `apps/client/src/modules/platform/marketplace/components/TemplatesGrid/components/TemplateCard/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/components/CodebaseBranchActionsMenu/components/ConflictItemError/index.tsx`
- [x] `apps/client/src/core/components/PodLogsTerminal/index.tsx`
- [x] `apps/client/src/core/providers/Form/components/FormControlLabelWithTooltip/index.tsx`
- [x] `apps/client/src/core/components/PodExecTerminal/index.tsx`
- [x] `apps/client/src/modules/platform/codebases/pages/details/components/SonarQubeMetrics/components/Value/index.tsx`
- [x] `apps/client/src/modules/platform/configuration/modules/clusters/components/ManageClusterSecret/components/Edit/components/FormActions/components/ClusterCDPipelineConflictError/index.tsx`
- [x] `apps/client/src/modules/platform/pipelines/pages/details/components/History/index.tsx`
- [x] `apps/client/src/modules/platform/pipelineruns/pages/details/styles.ts` (styles file - no Typography usage found)

---

## Checklist

- [x] Discovery complete (105 files found and listed above)
- [x] Migration complete - All `<Typography>` JSX usage migrated to semantic HTML + Tailwind classes
- [x] All Typography imports removed from `@mui/material`
- [x] All variant props converted to semantic HTML elements
- [x] All color props converted to Tailwind color classes
- [x] All fontSize/fontWeight props converted to Tailwind classes
- [x] All sx props converted to Tailwind classes
- [x] Component prop usage replaced with appropriate HTML elements

---

## ✅ MIGRATION COMPLETED

**Status:** 100% Complete  
**Date Completed:** December 2024  
**Files Migrated:** 100+ files  
**Typography Imports Removed:** All removed  
**Issues Resolved:** All resolved  

### Final Summary

- ✅ **All Typography components migrated** to semantic HTML (`<h1>`, `<h2>`, `<h6>`, `<p>`, `<span>`)
- ✅ **All color mappings corrected** - `color="primary"` → `text-foreground` (not `text-primary`)
- ✅ **All inline styles eliminated** - converted to Tailwind classes
- ✅ **All imports cleaned up** - no unused Typography imports remain
- ✅ **Linter errors fixed** - all TypeScript and ESLint issues resolved

---

## Notes

_Issues encountered and resolved:_

### Common Typography Patterns Found

1. **Dialog Headers** - Often use Typography with custom fontSize and color="primary.dark"
2. **Section Titles** - Use Typography with fontSize={20-32} and fontWeight={600}
3. **Body Text** - Use variant="body1" or variant="body2"
4. **Captions** - Use variant="caption" with color="primary.dark" or "text.secondary"
5. **Table Headers** - May use Typography for styling
6. **Form Labels/Info** - Use Typography for helper text

### Special Considerations

- **⚠️ CRITICAL - Typography Color Mapping:**
  - **MOST COMMON MISTAKE:** Agents incorrectly map `color="primary"` to `text-primary` (blue) instead of `text-foreground` (normal text)
  - **MUI Typography semantics:** In Typography, `color="primary"` means `theme.palette.text.primary` (normal body text), NOT `theme.palette.primary.main` (blue accent)
  - **Reference:** [MUI Typography API - color prop](https://mui.com/material-ui/api/typography/#typography-prop-color)
  - **Always remember:** For Typography → `color="primary"` = `text-foreground`, NOT `text-primary`
  - **If you see text turning blue unexpectedly, check if `color="primary"` was incorrectly mapped to `text-primary`**

- **⚠️ CRITICAL - NO Style Attributes:**
  - **ALL styling must be done with Tailwind classes - NO style attributes allowed**
  - **Common mistakes to avoid:**
    - ❌ `style={{ marginRight: "1.25rem" }}` → ✅ `className="mr-5"` (20px ÷ 4 = 5)
    - ❌ `style={{ paddingRight: theme.typography.pxToRem(16) }}` → ✅ `className="pr-4"` (16px ÷ 4 = 4)
    - ❌ `style={{ color: "#596D80" }}` → ✅ `className="text-muted-foreground"` (use semantic color)
    - ❌ `style={{ minWidth: 0 }}` → ✅ `className="min-w-0"`
    - ❌ `style={{ width: "100%" }}` → ✅ `className="w-full"`
  - **Calculation rule:** Convert px/rem → divide by 4px base unit, round to nearest integer
    - If not divisible by 4, round to closest multiple: 5px → 4px → use closest Tailwind class

- **MUI Theme Colors**: 
  - Colors like `primary.dark` may not be in Tailwind theme and may need CSS variables: `text-[var(--mui-palette-primary-dark)]`
  - However, for Typography, `color="primary.dark"` would be unusual - typically you'd see `color="primary"` or `color="text.primary"`

- **pxToRem conversions**: When using `theme.typography.pxToRem()`, calculate the pixel value, divide by 4px base unit, then find the closest standard Tailwind text size class (e.g., `pxToRem(32)` = 32px ÷ 4 = 8 → closest is `text-4xl` at 36px)
- **Font size matching**: Always use standard Tailwind text size classes. Calculate closest match: divide pixels by 4, then choose nearest standard class. Avoid arbitrary pixel values.
- **Component prop**: Replace with appropriate semantic HTML (`<h1>`, `<p>`, `<span>`, etc.)
- **Commented code**: Check for Typography in commented sections and migrate those too

### Migration Strategy

1. Start with high-traffic components (PageWrapper, Section, TabSection, BorderedSection)
2. Then migrate dialog headers (many files)
3. Then migrate view pages
4. Finally migrate hooks and utility components

---

