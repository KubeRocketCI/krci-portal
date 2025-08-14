# PipelineRun Visualization with Diagram Component

## Overview

This feature implements a comprehensive pipeline run visualization system that shows actual TaskRun execution status with rich interactive diagrams displaying task dependencies, statuses, and detailed information.

## User Story

As a DevOps engineer, I want to visualize pipeline run execution with actual task statuses so that I can quickly understand the execution flow, identify bottlenecks, and debug issues in my CI/CD pipelines.

## Requirements

### Functional Requirements

1. **PipelineRun Diagram Display**
   - Visual representation of pipeline run tasks with actual execution status
   - Support for both vertical and horizontal layout orientations
   - Status-based color coding for tasks and connecting edges
   - Finally task positioning and isolation detection

2. **Task Status Visualization**
   - Real-time status icons and colors for each task
   - Status-based edge coloring (edges colored by target task status)
   - Support for TaskRun and ApprovalTask status display

3. **Interactive Features**
   - Rich tooltips with task details, duration, and step information
   - Clickable links to navigate to specific task runs and steps
   - Zoom and pan controls with fit-to-view functionality
   - Minimap for large diagrams

4. **Integration**
   - Accessible from PipelineRun list with "View Diagram" button
   - Full-screen modal dialog for optimal viewing experience

### Technical Requirements

1. **Data Sources**
   - TaskRun resources for actual execution status
   - ApprovalTask resources for manual approval steps
   - Task resources for metadata and descriptions
   - PipelineRun resource for overall pipeline structure

2. **Performance**
   - Efficient data fetching and transformation
   - Optimized React Flow rendering
   - Minimal re-renders during status updates

## Acceptance Criteria

- ✅ **Pipeline Run list integration**: "View Diagram" button opens full-screen diagram
- ✅ **Status visualization**: Tasks show correct status icons and colors based on execution state
- ✅ **Edge coloring**: Connecting lines reflect target task status with appropriate colors
- ✅ **Layout modes**: Support both vertical and horizontal orientations with proper handle positioning
- ✅ **Finally tasks**: Proper positioning of finally tasks after main execution flow
- ✅ **Isolated tasks**: Visual indication for tasks with no dependencies or dependents
- ✅ **Rich tooltips**: Detailed information including status, duration, description, and steps
- ✅ **Navigation links**: Direct links to task run details and individual steps
- ✅ **Interactive controls**: Zoom, pan, fit-view, and minimap functionality

## Implementation

### Status: ✅ **Completed**

### Key Components

1. **PipelineRunDiagram** (`apps/client/src/modules/platform/pipelineruns/components/PipelineRunDiagram/index.tsx`)
   - Main diagram component using React Flow
   - Layout mode switching (vertical/horizontal)
   - Status-based edge coloring
   - Interactive controls and minimap

2. **PipelineRunTaskNode** (`apps/client/src/modules/platform/pipelineruns/components/PipelineRunDiagram/components/PipelineRunTaskNode.tsx`)
   - Custom node component with status icons
   - Rich tooltips with task details
   - Navigation links to task runs and steps
   - Finally/isolated task indicators

3. **usePipelineRunGraphData** (`apps/client/src/modules/platform/pipelineruns/components/PipelineRunDiagram/hooks/usePipelineRunGraphData.tsx`)
   - Data transformation hook
   - Dependency graph construction
   - Finally task positioning logic
   - Isolated task detection

4. **PipelineRunGraphDialog** (`apps/client/src/modules/platform/pipelineruns/dialogs/PipelineRunGraph/index.tsx`)
   - Full-screen modal container
   - Data fetching and loading states
   - Integration with existing data hooks

### Technical Architecture

#### Data Flow

```
PipelineRun + TaskRuns + ApprovalTasks + Tasks
↓ (buildPipelineRunTasksByNameMap)
Map<taskName, CombinedData>
↓ (usePipelineRunGraphData)
Nodes + Edges with Status + Layout
↓ (PipelineRunDiagram)
Interactive Visualization
```

#### Status System

- **TaskRun Status**: Uses `getTaskRunStatusIcon()` for execution states
- **ApprovalTask Status**: Uses `getApprovalTaskStatusIcon()` for approval states
- **Edge Colors**: Target task status determines connecting line color
- **Step Status**: Individual step status icons in tooltips

#### Layout Logic

- **Dependency Detection**: Analyzes `runAfter` fields to build dependency graph
- **Finally Task Positioning**: Uses constraint edges to place finally tasks after main flow
- **Isolated Task Detection**: Identifies tasks with no dependencies or dependents
- **Auto-layout**: Dagre algorithm for optimal node positioning

### Key Features Implemented

- ✅ **Real-time status visualization**: Tasks show current execution status with appropriate icons and colors
- ✅ **Status-aware edge coloring**: Connecting lines colored based on target task status with dashed animated edges
- ✅ **Clean tooltip system**: Simple, reliable tooltips with essential task information (status, duration, description, steps list)
- ✅ **Finally task handling**: Proper positioning with visual indicators and constraint edges
- ✅ **Smart isolated task detection**: Dashed borders for truly isolated tasks (excludes first tasks with no dependencies)
- ✅ **Consistent node sizing**: Fixed 180x60px dimensions for uniform layout appearance
- ✅ **Dual layout modes**: Vertical and horizontal orientations with dynamic handle positioning
- ✅ **Consistent UI design**: Matches Pipeline diagram styling and behavior patterns
- ✅ **Interactive controls**: Zoom, pan, fit-view, and minimap for large diagrams
- ✅ **List integration**: Diagram button in pipeline run list with tooltip
- ✅ **Stable rendering**: Fixed white screen issues and improved tooltip reliability
- ✅ **Enhanced visual feedback**: Animated dashed edges for pipeline flow visualization
- ✅ **Improved accessibility**: Removed misleading isolated labels from starting tasks

### Business Value

- **Operational Visibility**: Engineers can quickly assess pipeline run health and progress
- **Debugging Efficiency**: Visual identification of failed tasks and bottlenecks accelerates troubleshooting
- **Status Awareness**: Real-time execution status helps teams respond to issues promptly
- **Navigation Efficiency**: Direct links to specific tasks and steps streamline investigation workflows
- **Process Understanding**: Visual dependency flow helps teams understand pipeline execution logic

## Related Features

- Pipeline Visualization: Base diagram functionality for pipeline templates
- TaskRun Details: Detailed task execution information and logs
- Pipeline Run Management: Overall pipeline run lifecycle management

## Technical Notes

- Reuses existing `layoutUtils` from pipeline visualization for consistent behavior
- Integrates with existing status icon systems for TaskRun and ApprovalTask resources
- Uses established navigation patterns with `routePipelineRunDetails`
- Follows existing dialog management patterns with `useDialogContext`
- Maintains consistency with table column management using `getSyncedColumnData`
