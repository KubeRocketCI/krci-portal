import React from "react";
import { Edge, Node, Position } from "@xyflow/react";
import { PipelineRun, PipelineTask, TaskRun, ApprovalTask, Task } from "@my-project/shared";
import { getLayoutedElements } from "../../PipelineDiagram/utils/layoutUtils";

export interface PipelineRunTaskNodeData extends Record<string, unknown> {
  name: string;
  pipelineRunName: string;
  taskRun?: TaskRun;
  approvalTask?: ApprovalTask;
  task?: Task;
  pipelineTask: PipelineTask;
  isFinally?: boolean;
  isIsolated?: boolean;
}

export type MyNode = Node<PipelineRunTaskNodeData, "taskNode">;
export type MyEdge = Edge;

export interface PipelineRunTaskCombinedData {
  pipelineRunTask: PipelineTask;
  task?: Task;
  taskRun?: TaskRun;
  approvalTask?: ApprovalTask;
}

export const usePipelineRunGraphData = (
  pipelineRun: PipelineRun | undefined,
  tasksByNameMap: Map<string, PipelineRunTaskCombinedData> | undefined,
  direction: "TB" | "LR" = "TB"
): { nodes: MyNode[]; edges: MyEdge[] } => {
  return React.useMemo(() => {
    if (!pipelineRun || !tasksByNameMap || tasksByNameMap.size === 0) {
      return { nodes: [], edges: [] };
    }

    const mainTasks: PipelineTask[] = pipelineRun?.status?.pipelineSpec?.tasks || [];
    const finallyTasks: PipelineTask[] = pipelineRun?.status?.pipelineSpec?.finally || [];
    const allTasks = [...mainTasks, ...finallyTasks];

    if (allTasks.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Create a dependency map to detect isolated tasks
    const dependencyMap = new Map<string, { dependencies: Set<string>; dependents: Set<string> }>();

    // Initialize dependency tracking
    allTasks.forEach((task) => {
      if (task.name) {
        dependencyMap.set(task.name, { dependencies: new Set(), dependents: new Set() });
      }
    });

    // Build dependency relationships
    allTasks.forEach((task) => {
      if (task.name && task.runAfter) {
        const taskEntry = dependencyMap.get(task.name);
        if (taskEntry) {
          task.runAfter.forEach((dependency) => {
            taskEntry.dependencies.add(dependency);
            const depEntry = dependencyMap.get(dependency);
            if (depEntry) {
              depEntry.dependents.add(task.name!);
            }
          });
        }
      }
    });

    // Create initial nodes
    const initialNodes: MyNode[] = allTasks
      .filter((task) => task.name)
      .map((task) => {
        const taskName = task.name!;
        const taskData = tasksByNameMap.get(taskName);
        const isFinally = finallyTasks.some((t) => t.name === taskName);

        // Check if task is isolated (no dependencies and no dependents, but not a starting task)
        const deps = dependencyMap.get(taskName);
        // A task is isolated if it has no dependencies AND no dependents AND there are other tasks with dependencies
        const hasOtherTasksWithDeps = Array.from(dependencyMap.values()).some((d) => d.dependencies.size > 0);
        const isIsolated = deps
          ? deps.dependencies.size === 0 && deps.dependents.size === 0 && hasOtherTasksWithDeps
          : false;

        return {
          id: `task::${taskName}`,
          type: "taskNode",
          position: { x: 0, y: 0 },
          data: {
            name: taskName,
            pipelineRunName: pipelineRun.metadata.name,
            taskRun: taskData?.taskRun,
            approvalTask: taskData?.approvalTask,
            task: taskData?.task,
            pipelineTask: task,
            isFinally,
            isIsolated: isIsolated && !isFinally, // Don't mark finally tasks as isolated
          },
          draggable: false,
          sourcePosition: direction === "TB" ? Position.Bottom : Position.Right,
          targetPosition: direction === "TB" ? Position.Top : Position.Left,
        };
      });

    // Create initial edges based on runAfter dependencies
    const initialEdges: MyEdge[] = [];

    allTasks.forEach((task) => {
      if (task.name && task.runAfter) {
        task.runAfter.forEach((dependency) => {
          initialEdges.push({
            id: `edge::${dependency}::${task.name}`,
            source: `task::${dependency}`,
            target: `task::${task.name}`,
            type: "smoothstep",
          });
        });
      }
    });

    // Add constraint edges for finally tasks positioning
    if (finallyTasks.length > 0 && mainTasks.length > 0) {
      // Find last main tasks (those with dependencies but no other main tasks depending on them)
      const lastMainTasks = mainTasks.filter((task) => {
        if (!task.name) return false;
        const deps = dependencyMap.get(task.name);
        if (!deps) return false;

        // Has dependencies (not a starting task) but no main task dependents
        const hasMainTaskDependents = Array.from(deps.dependents).some((dependent) =>
          mainTasks.some((mainTask) => mainTask.name === dependent)
        );

        return deps.dependencies.size > 0 && !hasMainTaskDependents;
      });

      // If no specific last tasks found, use the actual last main task
      const tasksToConnect = lastMainTasks.length > 0 ? lastMainTasks : [mainTasks[mainTasks.length - 1]];

      // Add constraint edges from last main tasks to finally tasks
      tasksToConnect.forEach((lastTask) => {
        if (lastTask.name) {
          finallyTasks.forEach((finallyTask) => {
            if (finallyTask.name) {
              initialEdges.push({
                id: `constraint::${lastTask.name}::${finallyTask.name}`,
                source: `task::${lastTask.name}`,
                target: `task::${finallyTask.name}`,
                type: "smoothstep",
                hidden: true, // Hidden constraint edge
              });
            }
          });
        }
      });
    }

    // Apply layout and return
    const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges, direction);

    return {
      nodes: nodes as MyNode[],
      edges: edges as MyEdge[],
    };
  }, [pipelineRun, tasksByNameMap, direction]);
};
