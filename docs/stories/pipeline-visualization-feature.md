# Story 100.01: Tekton Pipeline Visualization with Diagram Component

## Story

**As a** Platform Engineer,
**I want** a dedicated pipelines page where I can view all Tekton pipelines in a table format and visualize individual pipeline diagrams with their tasks,
**so that** I can efficiently browse, understand, and analyze pipeline structures and task relationships in both vertical and horizontal layouts.

## Dependencies

## Acceptance Criteria

1. **Pipeline List Table** - Display all Tekton pipelines in table with name, description, and diagram button
2. **Pipeline Diagram** - Visual representation of pipeline tasks as interconnected tiles
3. **View Mode Toggle** - Switch between vertical and horizontal layout orientations
4. **Task Information** - Task tiles show names with hover tooltips for descriptions

## Technical Implementation

### Recommended Diagram Library: React Flow (@xyflow/react)

**Key benefits:** Purpose-built for node-based diagrams, excellent performance, built-in layout algorithms for DAG structures, customizable components, supports vertical/horizontal layouts.

### Pipeline Task Analysis for Diagram Direction

**Critical implementation detail:** To create the correct visual flow and task connections, the pipeline structure must be properly analyzed before rendering:

1. **Task Sources Merging:**
   - Regular tasks: `pipeline.spec.tasks[]` - main pipeline execution tasks
   - Finally tasks: `pipeline.spec.finally[]` - cleanup/notification tasks that run regardless of pipeline success/failure
   - Both arrays must be merged for complete pipeline visualization
   - Tasks from `pipeline.spec.tasks[]` should be drawn in follow-chain, if task doesn't have runAfter it means that this task shouldn't be connected to any tasks and it is one of initial tasks that are run in paralel
   - Tasks from `pipeline.spec.finally[]` should be drawn visually after main tasks, but they shouldn't be visually connected. Last task can be connected with final tasks with invisible lines.

2. **Dependency Analysis:**
   - `runAfter` field: Each task contains an optional `runAfter: string[]` field indicating prerequisite tasks
   - Tasks without `runAfter` are entry points (can start immediately)
   - Tasks with `runAfter` must wait for specified tasks to complete
   - Finally tasks always execute after all regular tasks, regardless of success/failure

3. **Task Information Available:**
   - `name`: Task identifier for connections
   - `description`: Optional description for tooltips
   - `displayName`: Optional human-readable name for display
   - `taskRef.name`: Reference to the actual Task definition

4. **UI**
   - Nodes should be just have theme background color and to be outlined.
   - Edges are animated and slightly curlied.
   - Spacing between nodes should be correct, so that the nodes couldn't overlap each other
   - Some tasks can have larger names than others, shrink names to specific length with triple dot and show whats remaining in tooltip

**Example Analysis Flow:**

```typescript
export const usePipelineGraphData = (pipeline: PipelineKubeObjectInterface) => {
  const pipelineTasks = React.useMemo(() => {
    const mainTasks = pipeline.spec.tasks || [];
    const finallyTasks = pipeline.spec.finally || [];

    return {
      allTasks: [...mainTasks, ...finallyTasks],
      mainTasks,
      finallyTasks,
    };
  }, [pipeline]);

  const noTasks = React.useMemo(() => {
    return !pipelineTasks.allTasks.length;
  }, [pipelineTasks.allTasks.length]);

  const MainPipelineTasksMap = React.useMemo(() => {
    const map = new Map<string, any>();

    pipelineTasks.mainTasks?.forEach((item: any) => {
      map.set(item.name, item);
    });
    return map;
  }, [pipelineTasks]);

  const FinallyPipelineTasksMap = React.useMemo(() => {
    const map = new Map<string, any>();
    pipelineTasks.finallyTasks?.forEach((item: any) => {
      map.set(item.name, item);
    });
    return map;
  }, [pipelineTasks]);

  const allTasksMap = React.useMemo(() => {
    return new Map<string, any>([
      ...MainPipelineTasksMap,
      ...FinallyPipelineTasksMap,
    ]);
  }, [FinallyPipelineTasksMap, MainPipelineTasksMap]);

  const nodes = React.useMemo(() => {
    if (noTasks) {
      return [];
    }

    let _nodes: MyNode[] = [];

    for (const name of allTasksMap.keys()) {
      _nodes = [
        {
          id: `task::${name}`,
          height: 40,
          width: 180,
          color: STATUS_COLOR.UNKNOWN,
          data: { name },
        },
        ..._nodes,
      ];
    }

    return _nodes;
  }, [allTasksMap, noTasks]);

  const edges = React.useMemo(() => {
    if (noTasks) {
      return [];
    }

    let _edges: MyEdge[] = [];

    for (const [name, value] of MainPipelineTasksMap.entries()) {
      if (!value?.runAfter) {
        continue;
      }

      for (const item of value.runAfter) {
        _edges = [
          {
            id: `edge::${name}::${item}`,
            source: `task::${item}`,
            color: STATUS_COLOR.UNKNOWN,
            target: `task::${name}`,
          },
          ..._edges,
        ];
      }
    }

    const lastMainTask =
      pipelineTasks.mainTasks[pipelineTasks.mainTasks.length - 1];

    for (const [name] of FinallyPipelineTasksMap.entries()) {
      _edges = [
        {
          id: `edge::${name}::${lastMainTask.name}`,
          source: `task::${lastMainTask.name}`,
          color: "transparent",
          noArrow: true,
          target: `task::${name}`,
        },
        ..._edges,
      ];
    }

    return _edges;
  }, [FinallyPipelineTasksMap, MainPipelineTasksMap, noTasks, pipelineTasks]);

  return { nodes, edges };
};
```

## Status: Completed

Implementation completed by Devon Coder on ${new Date().toISOString().split('T')[0]}

## Implementation Results

#### Summary

Successfully implemented the complete pipeline visualization feature with all required functionality:

#### Technical Implementation Details

- **PipelineDiagram Component**: Created at `apps/client/src/modules/platform/pipelines/components/PipelineDiagram/`
  - Uses React Flow (@xyflow/react) for high-performance diagram rendering
  - Implements automatic layout using Dagre library for optimal task positioning
  - Custom PipelineTaskNode component with themed styling and hover tooltips

- **usePipelineGraphData Hook**: Transforms Tekton pipeline specs into React Flow nodes and edges
  - Handles both main tasks (`pipeline.spec.tasks`) and finally tasks (`pipeline.spec.finally`)
  - Processes task dependencies via `runAfter` fields
  - Creates appropriate visual connections between tasks

- **Layout System**:
  - Vertical layout (TB - Top to Bottom) for traditional pipeline flows
  - Horizontal layout (LR - Left to Right) for wide screen viewing
  - Automatic node positioning with proper spacing to prevent overlaps

- **Visual Features**:
  - Task nodes with theme-consistent styling (outlined, background color)
  - Animated, curved edges between connected tasks
  - "Finally" tasks displayed with dashed borders and warning chips
  - Text truncation for long task names with full details in tooltips
  - Task reference information displayed below task names

#### Validation Results

- ✅ All TypeScript compilation errors resolved
- ✅ Project builds successfully without warnings
- ✅ Components follow established project patterns and conventions
- ✅ Integrates seamlessly with existing pipeline list and dialog infrastructure
- ✅ **Horizontal mode fix**: Resolved doubled lines issue and incorrect finally task positioning by implementing dynamic handle positions and proper constraint edge management
- ✅ **Dynamic handle positioning**: Fixed edge connection points to adapt to layout direction (top/bottom for vertical, left/right for horizontal)
- ✅ **Constraint edge management**: Restored constraint edges for proper finally task positioning while filtering them out from visual rendering
- ✅ **Optimized spacing and interactions**: Reduced node spacing for more compact layout and disabled dragging for cleaner static visualization
- ✅ **Auto-fit view on mode change**: Camera automatically resets and fits diagram when switching between vertical/horizontal layouts
- ✅ **Finally task styling fix**: Changed finally task borders and badges from orange to grey for consistent visual hierarchy
- ✅ **Hover functionality restored**: Fixed tooltip interaction while maintaining non-draggable node behavior
- ✅ **Isolated task styling**: Added dashed borders and "Isolated" labels for tasks with no dependencies or dependents, creating consistent visual hierarchy
- ✅ **Component architecture improvement**: Moved viewMode state management to PipelineDiagram component for better separation of concerns
- ✅ **Default horizontal layout**: Set horizontal view as the default for better space utilization

#### Business Value

- Engineers can now visualize complex pipeline dependencies and execution flows
- Improved understanding of pipeline structure accelerates debugging and optimization
- Dual layout modes accommodate different screen sizes and user preferences
- Enhanced user experience with interactive tooltips and professional styling

## Definition of Done

- [x] Pipeline list page displays all available Tekton pipelines in table format _(Already implemented)_
- [x] Diagram component renders pipeline tasks with visual connections
- [x] View mode toggle switches between vertical and horizontal layouts
- [x] Task tiles show names and display description tooltips on hover
- [x] Code review completed and approved
