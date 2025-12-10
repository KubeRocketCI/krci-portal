# React Data Fetching Optimization Pattern

## Problem Statement

When building React applications with real-time data (WebSocket subscriptions, polling, etc.), a common anti-pattern emerges:

```
❌ Anti-pattern: Data Composition at High Level

ParentComponent
├── useWatchHookA()      ← fetches all data
├── useWatchHookB()      ← fetches all data  
├── useWatchHookC()      ← fetches all data
├── composedData = useMemo(() => combine(A, B, C))  ← composition
└── <ChildComponent data={composedData} />  ← passes composed data down
```

**Issues:**
1. **Flickering**: All hooks must be "ready" before showing content, causing empty state flashes
2. **Unnecessary re-renders**: Any data change re-renders the entire tree
3. **Over-fetching**: Parent fetches ALL data even if children only need subsets
4. **Tight coupling**: Children depend on parent's data structure

---

## Solution: Push Data Fetching Deep & Fetch Only What You Need

```
✅ Pattern: Data Fetching at Point of Use

ParentComponent (no data hooks - just composition)
├── <ChildA />  ← fetches only what it needs
├── <ChildB />  ← fetches only what it needs
└── <ChildC />  ← fetches only what it needs
```

---

## Key Principles

### 1. Move Hooks as Deep as Possible

Instead of fetching at the page/container level, move hooks to the smallest component that needs the data.

```tsx
// ❌ Before: Parent fetches everything
const StageList = () => {
  const stages = useStageListWatch();
  const argoApps = useArgoApplicationListWatch(); // ALL apps
  const codebases = useCodebaseListWatch();
  
  // Compose data for all children
  const stagesWithApps = useMemo(() => 
    stages.map(stage => ({
      stage,
      apps: argoApps.filter(app => app.stage === stage.name)
    }))
  , [stages, argoApps]);
  
  return stagesWithApps.map(data => 
    <StageCard stageWithApps={data} />
  );
};

// ✅ After: Each child fetches its own data
const StageList = () => {
  const stages = useStageListWatch();
  
  return stages.map(stage => 
    <StageCard stage={stage} />  // Just pass the stage
  );
};

const StageCard = ({ stage }) => {
  // Fetch only THIS stage's apps
  const argoApps = useStageArgoAppsWatch(stage.name);
  // ...
};
```

### 2. Filter at API/Hook Level When Possible

Create specialized hooks that filter data at the source.

```tsx
// ❌ Before: Fetch all, filter in component
const useArgoApplicationListWatch = () => {
  return useApplicationWatchList({
    labels: { pipeline: pipelineName }  // Gets ALL pipeline apps
  });
};

// ✅ After: Filter by stage at API level
const useStageArgoApplicationListWatch = (stageName: string) => {
  return useApplicationWatchList({
    labels: { 
      pipeline: pipelineName,
      stage: stageName  // Only THIS stage's apps
    }
  });
};
```

### 3. Use Maps for Lookups Instead of Pre-computed Compositions

Instead of creating composed data structures, use Maps for O(1) lookups at render time.

```tsx
// ❌ Before: Pre-compose into new structure
const stagesWithApps = stages.map(stage => ({
  stage,
  applications: codebases.map(codebase => ({
    codebase,
    argoApp: argoApps.find(app => app.name === codebase.name)
  }))
}));

// ✅ After: Create Map, lookup when rendering
const argoAppsByName = useMemo(() => {
  const map = new Map();
  for (const app of argoApps) {
    map.set(app.metadata.labels.appName, app);
  }
  return map;
}, [argoApps]);

// In render:
{codebases.map(codebase => {
  const argoApp = argoAppsByName.get(codebase.name);
  return <AppRow codebase={codebase} argoApp={argoApp} />;
})}
```

### 4. Break Large Components into Focused Sub-components

Each sub-component should fetch only the data it displays.

```
EnvironmentCard/
  index.tsx              ← No hooks, just composition
  components/
    Header.tsx           ← Props only (stage)
    HealthSummary.tsx    ← Fetches: Argo apps (for health calc)
    ExternalServices.tsx ← Fetches: QuickLinks
    InfoGrid.tsx         ← Props only (stage)
    ApplicationsList.tsx ← Fetches: Argo apps, codebases
    CardActions.tsx      ← Props only (linkParams)
```

**Result**: When Argo apps update, only `HealthSummary` and `ApplicationsList` re-render.

---

## Implementation Checklist

When refactoring a component with performance/flickering issues:

- [ ] **Identify data sources**: List all `useWatch*` / `useQuery` hooks
- [ ] **Map data to UI sections**: Which data does each UI section actually need?
- [ ] **Create specialized hooks**: Add filtering at the hook level (e.g., by stage, by type)
- [ ] **Remove composition hooks**: Delete `useQuery` that combines multiple watches
- [ ] **Break into sub-components**: Create focused components for each UI section
- [ ] **Move hooks down**: Each sub-component fetches its own data
- [ ] **Use Maps for lookups**: Replace `.find()` with Map lookups

---

## Before/After Example

### Before (Flickering, slow)

```tsx
// data.ts - Composed hook that waits for everything
export const useStagesWithApplicationsWatch = () => {
  const cdPipeline = useCDPipelineWatch();
  const stages = useStageListWatch();
  const codebases = useCodebaseListWatch();
  const argoApps = useArgoApplicationListWatch();
  
  return useQuery({
    queryKey: [...],
    queryFn: () => combineStageWithApplications(stages, codebases, argoApps),
    enabled: cdPipeline.isReady && stages.isReady && codebases.isReady && argoApps.isReady
  });
};

// Component - receives pre-composed data
const StageList = () => {
  const { data, isLoading } = useStagesWithApplicationsWatch();
  // Flickers: shows empty → shows loading → shows data
};
```

### After (No flickering, fast)

```tsx
// data.ts - Simple, focused hooks
export const useStageListWatch = () => { /* ... */ };
export const useStageArgoApplicationListWatch = (stageName: string) => { /* ... */ };

// StageList - only fetches stages
const StageList = () => {
  const { data: stages } = useStageListWatch();
  return stages.map(stage => <EnvironmentCard stage={stage} />);
};

// EnvironmentCard - no hooks, just composition
const EnvironmentCard = ({ stage }) => (
  <Card>
    <Header stage={stage} />
    <HealthSummary stage={stage} />  {/* Fetches own data */}
    <ApplicationsList stage={stage} /> {/* Fetches own data */}
  </Card>
);

// HealthSummary - fetches only what it needs
const HealthSummary = ({ stage }) => {
  const argoApps = useStageArgoApplicationListWatch(stage.name);
  // Renders independently, updates when THIS stage's apps change
};
```

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Initial Load** | Wait for ALL data → flicker | Each section loads independently |
| **Updates** | Any change → full re-render | Only affected sections re-render |
| **Data Fetched** | All data at top level | Only needed data, filtered at source |
| **Component Coupling** | Tightly coupled to composed structure | Loosely coupled, props-based |
| **Code Organization** | Large monolithic components | Small, focused sub-components |

---

## Prompt Template for LLM

Use this prompt when asking an LLM to help optimize a similar component:

```
I have a React component with performance issues (flickering, unnecessary re-renders).

Current structure:
- [Describe your component hierarchy]
- [List the data hooks used at the top level]
- [Describe what data each UI section needs]

Please help me refactor following these principles:
1. Move data hooks as deep as possible into sub-components
2. Create specialized hooks that filter data at the API level
3. Break the component into focused sub-components
4. Each sub-component should fetch only the data it displays
5. Use Maps for efficient lookups instead of pre-computed compositions
6. The parent component should have NO data hooks - just composition

Expected outcome:
- No flickering on initial load
- Granular re-renders (only affected sections update)
- Each component fetches only what it needs
```

