# Migration Plan: Create Unified `tekton` Module

## Overview

Consolidate `pipelines`, `pipelineruns`, and `k8s/tektonResults` into a single `tekton` module following the existing pattern of `codebases/` and `cdpipelines/`.

## Current State

### Source Locations

| Source | Files | Purpose |
| ------ | ----- | ------- |
| `modules/platform/pipelines/` | 34 files | Pipeline management |
| `modules/platform/pipelineruns/` | 83 files | PipelineRun management |
| `k8s/tektonResults/` | 11 files | Tekton Results API integration |
| **Total** | **128 files** | |

### Current Structure

```text
modules/platform/
├── pipelines/
│   ├── components/
│   │   ├── Pipeline/
│   │   ├── PipelineActionsMenu/
│   │   └── PipelineDiagram/
│   ├── dialogs/
│   │   └── PipelineGraph/
│   └── pages/
│       ├── details/
│       └── list/
└── pipelineruns/
    ├── components/
    │   ├── PipelineRunActionsMenu/
    │   ├── PipelineRunDiagram/
    │   └── PipelineRunList/
    ├── dialogs/
    │   └── PipelineRunGraph/
    ├── pages/
    │   ├── details/
    │   ├── list/
    │   └── tekton-result-details/
    └── utils/

k8s/tektonResults/
├── components/
│   └── TektonResultsTable/
├── hooks/
│   ├── usePipelineActivityChart/
│   ├── usePipelineMetrics/
│   └── useTektonResults/
└── utils/
    └── celFilters.ts
```

## Target State

### Target Structure

```text
modules/platform/tekton/
├── components/
│   ├── Pipeline/
│   ├── PipelineActionsMenu/
│   ├── PipelineDiagram/
│   ├── PipelineRunActionsMenu/
│   ├── PipelineRunDiagram/
│   ├── PipelineRunList/
│   └── TektonResultsTable/
├── dialogs/
│   ├── PipelineGraph/
│   └── PipelineRunGraph/
├── hooks/
│   ├── usePipelineActivityChart/
│   ├── usePipelineMetrics/
│   └── useTektonResults/
├── pages/
│   ├── pipeline-details/
│   ├── pipeline-list/
│   ├── pipelinerun-details/
│   ├── pipelinerun-list/
│   └── tekton-result-details/
└── utils/
    ├── celFilters.ts
    └── statusIcons.ts
```

## Migration Steps

### Phase 1: Create Target Directory Structure

```bash
mkdir -p apps/client/src/modules/platform/tekton/{components,dialogs,hooks,pages,utils}
```

### Phase 2: Move Components

| Source | Target |
| ------ | ------ |
| `pipelines/components/Pipeline/` | `tekton/components/Pipeline/` |
| `pipelines/components/PipelineActionsMenu/` | `tekton/components/PipelineActionsMenu/` |
| `pipelines/components/PipelineDiagram/` | `tekton/components/PipelineDiagram/` |
| `pipelineruns/components/PipelineRunActionsMenu/` | `tekton/components/PipelineRunActionsMenu/` |
| `pipelineruns/components/PipelineRunDiagram/` | `tekton/components/PipelineRunDiagram/` |
| `pipelineruns/components/PipelineRunList/` | `tekton/components/PipelineRunList/` |
| `k8s/tektonResults/components/TektonResultsTable/` | `tekton/components/TektonResultsTable/` |

### Phase 3: Move Dialogs

| Source | Target |
| ------ | ------ |
| `pipelines/dialogs/PipelineGraph/` | `tekton/dialogs/PipelineGraph/` |
| `pipelineruns/dialogs/PipelineRunGraph/` | `tekton/dialogs/PipelineRunGraph/` |

### Phase 4: Move Hooks

| Source | Target |
| ------ | ------ |
| `k8s/tektonResults/hooks/useTektonResults/` | `tekton/hooks/useTektonResults/` |
| `k8s/tektonResults/hooks/usePipelineMetrics/` | `tekton/hooks/usePipelineMetrics/` |
| `k8s/tektonResults/hooks/usePipelineActivityChart/` | `tekton/hooks/usePipelineActivityChart/` |

### Phase 5: Move Pages (Rename for Clarity)

| Source | Target |
| ------ | ------ |
| `pipelines/pages/list/` | `tekton/pages/pipeline-list/` |
| `pipelines/pages/details/` | `tekton/pages/pipeline-details/` |
| `pipelineruns/pages/list/` | `tekton/pages/pipelinerun-list/` |
| `pipelineruns/pages/details/` | `tekton/pages/pipelinerun-details/` |
| `pipelineruns/pages/tekton-result-details/` | `tekton/pages/tekton-result-details/` |

### Phase 6: Move Utils

| Source | Target |
| ------ | ------ |
| `k8s/tektonResults/utils/celFilters.ts` | `tekton/utils/celFilters.ts` |
| `pipelineruns/utils/statusIcons.ts` | `tekton/utils/statusIcons.ts` |

### Phase 7: Update Internal Imports

Files within the tekton module need updated relative imports:

**Components importing other components:**
- `TektonResultsTable` → imports from `../hooks/useTektonResults`
- `PipelineRunList` → imports from `../../pages/pipelinerun-details/route`

**Pages importing components:**
- `pipeline-details/` → imports from `../../components/PipelineDiagram`
- `pipelinerun-list/` → imports from `../../components/TektonResultsTable`

### Phase 8: Update External Imports

#### Files importing from `pipelines/` (8 files)

| File | Current Import | New Import |
| ---- | -------------- | ---------- |
| `cdpipelines/pages/stage-details/.../useInfoColumns.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |
| `codebases/pages/details/.../useInfoRows.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |
| `codebases/dialogs/.../BuildPipeline/index.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |
| `codebases/dialogs/.../ReviewPipeline/index.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |
| `cdpipelines/dialogs/.../CleanTemplate/index.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |
| `cdpipelines/dialogs/.../DeployTemplate/index.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |
| `cdpipelines/components/.../CleanTemplate/index.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |
| `cdpipelines/components/.../DeployTemplate/index.tsx` | `@/modules/platform/pipelines/dialogs/PipelineGraph` | `@/modules/platform/tekton/dialogs/PipelineGraph` |

#### Files importing from `pipelineruns/` (6 files)

| File | Current Import | New Import |
| ---- | -------------- | ---------- |
| `cdpipelines/pages/stage-details/.../StagePipelineRuns/index.tsx` | `@/modules/platform/pipelineruns/components/PipelineRunList` | `@/modules/platform/tekton/components/PipelineRunList` |
| `codebases/pages/details/.../Details/index.tsx` | `@/modules/platform/pipelineruns/components/PipelineRunList` | `@/modules/platform/tekton/components/PipelineRunList` |
| `home/pages/home/view.tsx` | `@/modules/platform/pipelineruns/pages/list/route` | `@/modules/platform/tekton/pages/pipelinerun-list/route` |
| `home/pages/home/view.tsx` | `@/modules/platform/pipelines/pages/list/route` | `@/modules/platform/tekton/pages/pipeline-list/route` |

#### Files importing from `k8s/tektonResults/` (4 files)

| File | Current Import | New Import |
| ---- | -------------- | ---------- |
| `observability/pages/pipeline-metrics/hooks/useMetricsData.ts` | `@/k8s/tektonResults/hooks/usePipelineMetrics` | `@/modules/platform/tekton/hooks/usePipelineMetrics` |
| `observability/pages/pipeline-metrics/.../PipelineActivityChart/index.tsx` | `@/k8s/tektonResults/hooks/usePipelineActivityChart` | `@/modules/platform/tekton/hooks/usePipelineActivityChart` |

### Phase 9: Update Router Configuration

**File:** `apps/client/src/core/router/index.ts`

```typescript
// BEFORE
import { routePipelineDetails } from "@/modules/platform/pipelines/pages/details/route";
import { routePipelineList } from "@/modules/platform/pipelines/pages/list/route";
import { routePipelineRunList } from "@/modules/platform/pipelineruns/pages/list/route";
import { routePipelineRunDetails } from "@/modules/platform/pipelineruns/pages/details/route";
import { routeTektonResultPipelineRunDetails } from "@/modules/platform/pipelineruns/pages/tekton-result-details/route";

// AFTER
import { routePipelineDetails } from "@/modules/platform/tekton/pages/pipeline-details/route";
import { routePipelineList } from "@/modules/platform/tekton/pages/pipeline-list/route";
import { routePipelineRunList } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { routePipelineRunDetails } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { routeTektonResultPipelineRunDetails } from "@/modules/platform/tekton/pages/tekton-result-details/route";
```

### Phase 10: Update Sidebar Navigation

**File:** `apps/client/src/core/components/sidebar/navigationConfig.ts`

```typescript
// BEFORE
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/pipelineruns/pages/list/route";
import { PATH_PIPELINES_FULL } from "@/modules/platform/pipelines/pages/list/route";

// AFTER
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { PATH_PIPELINES_FULL } from "@/modules/platform/tekton/pages/pipeline-list/route";
```

### Phase 11: Cleanup

1. Remove empty source directories:
   - `modules/platform/pipelines/`
   - `modules/platform/pipelineruns/`
   - `k8s/tektonResults/`

2. Verify no orphaned imports remain

### Phase 12: Verification

1. Run TypeScript compilation: `pnpm --filter=client tsc --noEmit`
2. Run build: `pnpm --filter=client build`
3. Run tests (if any): `pnpm --filter=client test`
4. Manual verification:
   - Navigate to Pipeline list page
   - Navigate to Pipeline details page
   - Navigate to PipelineRun list page
   - Navigate to PipelineRun details page
   - Navigate to Tekton Result details page
   - Verify observability metrics page still works

## Import Path Summary

### Old → New Mapping

| Old Path | New Path |
| -------- | -------- |
| `@/modules/platform/pipelines/components/*` | `@/modules/platform/tekton/components/*` |
| `@/modules/platform/pipelines/dialogs/*` | `@/modules/platform/tekton/dialogs/*` |
| `@/modules/platform/pipelines/pages/list/*` | `@/modules/platform/tekton/pages/pipeline-list/*` |
| `@/modules/platform/pipelines/pages/details/*` | `@/modules/platform/tekton/pages/pipeline-details/*` |
| `@/modules/platform/pipelineruns/components/*` | `@/modules/platform/tekton/components/*` |
| `@/modules/platform/pipelineruns/dialogs/*` | `@/modules/platform/tekton/dialogs/*` |
| `@/modules/platform/pipelineruns/pages/list/*` | `@/modules/platform/tekton/pages/pipelinerun-list/*` |
| `@/modules/platform/pipelineruns/pages/details/*` | `@/modules/platform/tekton/pages/pipelinerun-details/*` |
| `@/modules/platform/pipelineruns/pages/tekton-result-details/*` | `@/modules/platform/tekton/pages/tekton-result-details/*` |
| `@/modules/platform/pipelineruns/utils/*` | `@/modules/platform/tekton/utils/*` |
| `@/k8s/tektonResults/components/*` | `@/modules/platform/tekton/components/*` |
| `@/k8s/tektonResults/hooks/*` | `@/modules/platform/tekton/hooks/*` |
| `@/k8s/tektonResults/utils/*` | `@/modules/platform/tekton/utils/*` |

## Risk Assessment

| Risk | Mitigation |
| ---- | ---------- |
| Route paths change breaking bookmarks | Keep same URL paths, only change file locations |
| Missed import updates | Run TypeScript compiler to catch errors |
| Circular dependencies | Review import graph after migration |
| Test failures | Run full test suite after each phase |

## Rollback Plan

If issues arise:
1. Git revert the migration commit
2. Re-run build to verify rollback successful

## Estimated Scope

- **Files to move:** 128
- **Files to update imports:** ~20 external files
- **Routes to update:** 5
- **Total estimated changes:** ~150 files
