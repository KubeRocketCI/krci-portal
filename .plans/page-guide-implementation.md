# Page Guide Implementation Plan

## Overview

Implement a **Page Guide** feature similar to Form Guide, but for pages instead of forms. Users can start interactive tours that navigate through page sections and tabs, highlighting key features and capabilities. A one-time global hint will introduce users to the Page Guide button on their first visit.

## Goals

1. Create a reusable Page Guide system that works across different page types
2. Implement interactive tours with automatic tab switching for multi-tab pages
3. Add one-time global hint to introduce the Page Guide button to users
4. Start with Projects List page and Project Details page (5 tabs)
5. Create a pattern that can be easily extended to other pages

## Architecture Decision: Extend Tours vs. Create New System

**Decision: Extend the existing Tours system rather than creating a separate PageGuide provider.**

### Rationale:
- The existing Tours system (using react-joyride) already provides:
  - One-time hint mechanism (`showOnce`, `trigger: "feature"`)
  - Interactive tours with Next/Back/Skip
  - Tour completion tracking in localStorage
  - Beautiful UI consistent with the design system
- FormGuide is for sidebar help panels with field descriptions
- PageGuide is for guided tours, which is exactly what Tours does
- Avoids code duplication and complexity
- Consistent UX with existing welcome tour

### What's New:
- Add "Page Guide" button component (similar to FormGuideToggleButton)
- Add page-specific tour configurations to TOURS_CONFIG
- Add global page guide intro tour
- Implement tab-switching capability during tours

## Key Components

### 1. PageGuideButton Component

**Location:** `/apps/client/src/core/components/PageGuide/PageGuideButton.tsx`

**Purpose:** Toggle button to start page tours

**Features:**
- Similar to FormGuideToggleButton
- Shows pulse indicator when tour is available and not completed
- Uses `useAutoTour()` for the global one-time hint
- Accepts `tourId` prop to identify which page tour to start
- Positioned in PageWrapper headerSlot (next to Learn More link)

**Implementation:**
```tsx
interface PageGuideButtonProps {
  tourId: string; // e.g., "projects_list_tour" or "project_details_tour"
}

export function PageGuideButton({ tourId }: PageGuideButtonProps) {
  const { startTour, isTourCompleted } = useTours();
  const tour = TOURS_CONFIG[tourId];

  // Show global intro only once
  useAutoTour(TOURS_CONFIG.pageGuideIntro, 500);

  const handleClick = () => {
    if (tour) {
      startTour(tour.id, tour, { type: "manual" });
    }
  };

  if (!tour) return null;

  const completed = isTourCompleted(tour.id);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      data-tour="page-guide-button"
    >
      <CircleHelp size={16} />
      Page Guide
      {!completed && <span className="animate-pulse bg-primary ..." />}
    </Button>
  );
}
```

### 2. Tour Configurations

**Location:** `/apps/client/src/modules/tours/config.tsx` (extend existing)

**Add the following tours:**

#### 2.1 Global Page Guide Intro (One-time)
```tsx
pageGuideIntro: {
  id: "page_guide_intro",
  title: "Page Guide",
  description: "Learn about the Page Guide feature",
  showOnce: true,
  trigger: "feature",
  featureId: "page-guide",
  steps: [
    {
      target: "[data-tour='page-guide-button']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Discover Page Tours</h3>
          <p>
            Click the Page Guide button to start an interactive tour of the current page.
            Each page tour will walk you through its key features and capabilities.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
  ],
}
```

#### 2.2 Projects List Tour
```tsx
projectsListTour: {
  id: "projects_list_tour",
  title: "Projects List Tour",
  description: "Learn about the Projects list page features",
  showOnce: false, // Users can replay this
  trigger: "manual",
  steps: [
    {
      target: "[data-tour='projects-table']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Projects Overview</h3>
          <p>
            This table shows all your projects (codebases) with real-time status updates.
            You can see applications, libraries, autotests, and infrastructure code.
          </p>
        </div>
      ),
      placement: "top",
      disableBeacon: true,
    },
    {
      target: "[data-tour='projects-filter']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Filter Projects</h3>
          <p>
            Use these filters to narrow down projects by type, language, framework, or status.
            Filters sync with the URL so you can bookmark specific views.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='create-project-button']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Create New Project</h3>
          <p>
            Click here to create a new project. You can import existing code or create from a template.
            The wizard will guide you through the configuration.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='project-actions']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Project Actions</h3>
          <p>
            Each project has actions for configuration, deletion, and more.
            Select multiple projects to perform bulk operations.
          </p>
        </div>
      ),
      placement: "left",
    },
  ],
}
```

#### 2.3 Project Details Tour (with Tab Switching)
```tsx
projectDetailsTour: {
  id: "project_details_tour",
  title: "Project Details Tour",
  description: "Learn about all the tabs and features in the project details page",
  showOnce: false,
  trigger: "manual",
  steps: [
    // Overview tab
    {
      target: "[data-tour='project-tabs']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Project Tabs</h3>
          <p>
            This project has 5 tabs: Overview, Branches, Pipelines, Pull Requests, and Deployments.
            Let's explore each one!
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "[data-tour='overview-info']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Project Information</h3>
          <p>
            See key project details: language, framework, build tool, versioning strategy,
            pipelines, status, and type.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: "[data-tour='code-quality-widget']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Code Quality</h3>
          <p>
            This widget shows a brief overview of your project's code quality metrics
            from your quality gate system.
          </p>
        </div>
      ),
      placement: "top",
    },
    {
      target: "[data-tour='dependencies-widget']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Dependencies</h3>
          <p>
            Monitor your project's security posture with dependency scanning results.
            See vulnerabilities and outdated packages at a glance.
          </p>
        </div>
      ),
      placement: "top",
    },
    // Branches tab - SWITCH TAB HERE
    {
      target: "[data-tour='branches-table']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Branches Overview</h3>
          <p>
            View all branches with their types, status, last build info, current version,
            and build capabilities.
          </p>
        </div>
      ),
      placement: "top",
      // Custom data to trigger tab switch
      data: { switchToTab: "branches" },
    },
    {
      target: "[data-tour='create-branch-button']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Create Branch</h3>
          <p>
            Create a new branch or release branch. The wizard will help you configure
            versioning and build settings.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='branch-actions']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Branch Actions</h3>
          <p>
            Configure or delete branches, and trigger builds directly from the actions menu.
          </p>
        </div>
      ),
      placement: "left",
    },
    // Pipelines tab - SWITCH TAB HERE
    {
      target: "[data-tour='pipelines-table']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Pipeline Runs</h3>
          <p>
            See all pipeline runs for this project from Tekton. Filter by branch to view
            specific build and test results.
          </p>
        </div>
      ),
      placement: "top",
      data: { switchToTab: "pipelines" },
    },
    {
      target: "[data-tour='pipeline-history']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Pipeline History</h3>
          <p>
            Access detailed pipeline run history from Tekton Results, including logs,
            artifacts, and metrics.
          </p>
        </div>
      ),
      placement: "top",
    },
    // Pull Requests tab - SWITCH TAB HERE
    {
      target: "[data-tour='pull-requests-table']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Pull Requests</h3>
          <p>
            View and manage pull requests for this project. See status, reviewers,
            and linked pipeline runs.
          </p>
        </div>
      ),
      placement: "top",
      data: { switchToTab: "code" },
    },
    // Deployments tab - SWITCH TAB HERE
    {
      target: "[data-tour='deployments-table']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Deployment Status</h3>
          <p>
            See where this project is deployed, its version in each environment,
            and which CD Pipeline and Stage (Environment) it belongs to.
          </p>
        </div>
      ),
      placement: "top",
      data: { switchToTab: "deployments" },
    },
  ],
}
```

### 3. Tab Switching Logic

**Location:** `/apps/client/src/modules/tours/utils.ts` (new utility)

**Purpose:** Handle automatic tab switching during tours

**Implementation:**
```tsx
import { router } from "@/core/router";
import { Step } from "react-joyride";

/**
 * Custom callback handler for tours that need to switch tabs
 */
export function createTabSwitchingCallback(
  params: { clusterName: string; namespace: string; name: string },
  routePath: string,
  tabMap: Record<string, string>
) {
  return (data: CallBackProps) => {
    const { step, action, type } = data;

    // When moving to next step, check if tab switch is needed
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      const stepData = (step as Step).data as { switchToTab?: string } | undefined;

      if (stepData?.switchToTab && tabMap[stepData.switchToTab]) {
        router.navigate({
          to: routePath,
          params,
          search: { tab: tabMap[stepData.switchToTab] },
        });
      }
    }
  };
}
```

### 4. Enhanced Tours Provider

**Location:** `/apps/client/src/modules/tours/providers/provider.tsx` (modify existing)

**Changes:**
- Add support for custom callbacks per tour
- Handle tab switching logic
- Ensure tours wait for tab content to load before advancing

**New context value:**
```tsx
interface ToursContextValue {
  startTour: (tourId: string, tour: TourMetadata, trigger?: TourTriggerInfo) => void;
  skipTour: () => void;
  isTourCompleted: (tourId: string) => boolean;
  isRunning: boolean;
  setOnTourEnd: (callback: TourEndCallback | null) => void;
  // NEW: Custom step callback for advanced tour logic
  setStepCallback: (callback: ((data: CallBackProps) => void) | null) => void;
}
```

## Implementation Steps

### Phase 1: Core Infrastructure

1. **Create PageGuide components directory**
   - `/apps/client/src/core/components/PageGuide/`
   - `PageGuideButton.tsx` - Main button component
   - `index.ts` - Barrel export

2. **Update Tours configuration**
   - Add `pageGuideIntro` to `TOURS_CONFIG`
   - Add page-specific tour configs (projects list, project details)

3. **Add tab switching utility**
   - Create `/apps/client/src/modules/tours/utils.ts` enhancements
   - Implement `createTabSwitchingCallback()` helper

4. **Enhance Tours Provider**
   - Add `setStepCallback()` to context
   - Handle custom step callbacks in Joyride
   - Add delay after tab switches to ensure content loads

### Phase 2: Projects List Page

1. **Add data-tour attributes**
   - `ComponentList` component: `data-tour="projects-table"`
   - `CodebaseFilter`: `data-tour="projects-filter"`
   - Create button link: `data-tour="create-project-button"`
   - Actions menu: `data-tour="project-actions"`

2. **Add PageGuideButton**
   - Update `/apps/client/src/modules/platform/codebases/pages/list/view.tsx`
   - Add `<PageGuideButton tourId="projectsListTour" />` in headerSlot

3. **Configure tour steps**
   - Ensure all tour targets exist and are visible
   - Test tour flow and adjust placements

### Phase 3: Project Details Page

1. **Add data-tour attributes**
   - Tabs component: `data-tour="project-tabs"`
   - Overview info grid: `data-tour="overview-info"`
   - Code Quality widget: `data-tour="code-quality-widget"`
   - Dependencies widget: `data-tour="dependencies-widget"`
   - Branches table: `data-tour="branches-table"`
   - Create branch button: `data-tour="create-branch-button"`
   - Branch actions: `data-tour="branch-actions"`
   - Pipelines table: `data-tour="pipelines-table"`
   - Pipeline history: `data-tour="pipeline-history"`
   - Pull requests table: `data-tour="pull-requests-table"`
   - Deployments table: `data-tour="deployments-table"`

2. **Add PageGuideButton**
   - Update `/apps/client/src/modules/platform/codebases/pages/details/view.tsx`
   - Add `<PageGuideButton tourId="projectDetailsTour" />` in headerSlot

3. **Implement tab switching**
   - Use `useTabsContext()` to programmatically switch tabs
   - Add step callback to handle tab transitions
   - Add delay to ensure tab content renders before highlighting

4. **Configure tour steps**
   - Define all steps with proper tab switching logic
   - Test entire flow across all 5 tabs

### Phase 4: Testing & Polish

1. **Visual testing**
   - Test on different screen sizes
   - Ensure spotlight and tooltips position correctly
   - Verify pulse indicator behavior

2. **Flow testing**
   - Test complete tours from start to finish
   - Test skip functionality
   - Test completion tracking
   - Test tab switching timing

3. **Edge cases**
   - Test when tour targets don't exist (error handling)
   - Test multiple rapid tour starts
   - Test tour persistence across page refreshes

4. **Accessibility**
   - Ensure keyboard navigation works
   - Verify screen reader announcements
   - Test focus management

### Phase 5: Documentation & Patterns

1. **Update memory documentation**
   - Create `/memory/page-guide.md` with usage patterns
   - Document how to add tours to new pages
   - Include examples for single-page and multi-tab tours

2. **Code comments**
   - Add JSDoc comments to PageGuideButton
   - Document tab switching mechanism
   - Add usage examples in component files

## File Structure

```
apps/client/src/
├── core/
│   └── components/
│       └── PageGuide/
│           ├── PageGuideButton.tsx
│           └── index.ts
├── modules/
│   ├── platform/
│   │   └── codebases/
│   │       └── pages/
│   │           ├── list/
│   │           │   ├── view.tsx (+ PageGuideButton)
│   │           │   └── components/
│   │           │       ├── ComponentList/index.tsx (+ data-tour)
│   │           │       └── CodebaseFilter/index.tsx (+ data-tour)
│   │           └── details/
│   │               ├── view.tsx (+ PageGuideButton)
│   │               └── components/
│   │                   ├── Overview/index.tsx (+ data-tour)
│   │                   ├── BranchList/index.tsx (+ data-tour)
│   │                   ├── PipelineList/index.tsx (+ data-tour)
│   │                   ├── PullRequestList/index.tsx (+ data-tour)
│   │                   └── DeploymentStatusWidget/index.tsx (+ data-tour)
│   └── tours/
│       ├── config.tsx (+ new tour configs)
│       ├── utils.ts (+ tab switching helpers)
│       └── providers/
│           ├── provider.tsx (+ step callback support)
│           └── types.ts (+ enhanced types)
```

## Data Tour Attributes Mapping

### Projects List Page
| Component | data-tour attribute | Description |
|-----------|---------------------|-------------|
| ComponentList table | `projects-table` | Main projects table |
| CodebaseFilter | `projects-filter` | Filter controls |
| Create Project button | `create-project-button` | Create action |
| Row actions menu | `project-actions` | Per-project actions |

### Project Details Page
| Component | Tab | data-tour attribute | Description |
|-----------|-----|---------------------|-------------|
| Tabs component | All | `project-tabs` | Tab navigation |
| Overview info grid | Overview | `overview-info` | Project metadata |
| Code Quality widget | Overview | `code-quality-widget` | Quality metrics |
| Dependencies widget | Overview | `dependencies-widget` | Security status |
| BranchList table | Branches | `branches-table` | Branches overview |
| Create branch button | Branches | `create-branch-button` | Create action |
| Branch actions menu | Branches | `branch-actions` | Per-branch actions |
| PipelineList table | Pipelines | `pipelines-table` | Pipeline runs |
| TektonResultsHistory | Pipelines | `pipeline-history` | Historical data |
| PullRequestList table | Pull Requests | `pull-requests-table` | PR overview |
| DeploymentStatusWidget | Deployments | `deployments-table` | Deployment status |

## Extending to Other Pages

To add Page Guide to a new page:

1. **Define tour config** in `tours/config.tsx`:
   ```tsx
   myPageTour: {
     id: "my_page_tour",
     title: "My Page Tour",
     description: "Learn about My Page",
     showOnce: false,
     trigger: "manual",
     steps: [/* ... */],
   }
   ```

2. **Add data-tour attributes** to components:
   ```tsx
   <div data-tour="my-target">Content</div>
   ```

3. **Add PageGuideButton** to page:
   ```tsx
   <PageWrapper headerSlot={
     <>
       <LearnMoreLink url={...} />
       <PageGuideButton tourId="myPageTour" />
     </>
   }>
   ```

4. **For multi-tab pages**, add tab switching:
   - Add `data: { switchToTab: "tab-name" }` to steps
   - Ensure tab navigation updates URL search params
   - Test tab content loading before tour advances

## Success Criteria

- [ ] PageGuideButton component created and working
- [ ] Global one-time hint shows on first page guide encounter
- [ ] Projects list tour works with all 4 steps
- [ ] Project details tour works with all steps across 5 tabs
- [ ] Tab switching is smooth and waits for content to load
- [ ] Tour completion is tracked per-tour (users can replay)
- [ ] Global hint is tracked globally (shows only once)
- [ ] Button shows pulse indicator for incomplete tours
- [ ] All data-tour attributes are in place
- [ ] Documentation updated in memory/page-guide.md
- [ ] Pattern is clear and reusable for other pages

## Future Enhancements (Out of Scope)

- Add Page Guide to Deployments (CD Pipelines) pages
- Add Page Guide to Environments (Stages) pages
- Add Page Guide to Overview/Dashboard page
- Add Page Guide to Security pages (SAST/SCA)
- Add Page Guide to Observability pages
- Add tour analytics (track which tours are most completed)
- Add tour search/discovery page in settings
- Add "Show me around" button on empty states
