import React from "react";
import { Pipeline, PipelineTask } from "@my-project/shared";
import { Node, Edge } from "@xyflow/react";
import { getLayoutedElements } from "../utils/layoutUtils";

export interface MyNode extends Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    name: string;
    namespace: string;
    description?: string;
    displayName?: string;
    taskRef?: {
      name?: string;
      kind?: string;
      apiVersion?: string;
    };
    isFinally?: boolean;
    isIsolated?: boolean;
  };
  style?: {
    width?: number;
    height?: number;
  };
}

export interface MyEdge extends Edge {
  id: string;
  source: string;
  target: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
  animated?: boolean;
}

const STATUS_COLOR = {
  UNKNOWN: "#9ca3af",
  SUCCESS: "#10b981",
  RUNNING: "#3b82f6",
  FAILED: "#ef4444",
  PENDING: "#f59e0b",
};

export const usePipelineGraphData = (
  pipeline: Pipeline,
  namespace: string,
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } => {
  const pipelineTasks = React.useMemo(() => {
    const mainTasks = pipeline.spec?.tasks || [];
    const finallyTasks = pipeline.spec?.finally || [];

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
    const map = new Map<string, PipelineTask>();

    pipelineTasks.mainTasks?.forEach((item: PipelineTask) => {
      if (item.name) {
        map.set(item.name, item);
      }
    });
    return map;
  }, [pipelineTasks.mainTasks]);

  const FinallyPipelineTasksMap = React.useMemo(() => {
    const map = new Map<string, PipelineTask>();

    pipelineTasks.finallyTasks?.forEach((item: PipelineTask) => {
      if (item.name) {
        map.set(item.name, item);
      }
    });
    return map;
  }, [pipelineTasks.finallyTasks]);

  const initialNodes = React.useMemo(() => {
    if (noTasks) {
      return [];
    }

    // Calculate isolated tasks (no dependencies AND nothing depends on them)
    const tasksWithDependents = new Set<string>();
    const tasksWithDependencies = new Set<string>();

    for (const [, task] of MainPipelineTasksMap.entries()) {
      if (task.runAfter && task.runAfter.length > 0) {
        tasksWithDependencies.add(task.name!);
        task.runAfter.forEach((dep) => tasksWithDependents.add(dep));
      }
    }

    // eslint-disable-next-line prefer-const
    let _nodes: MyNode[] = [];

    // Add main tasks
    for (const [name, task] of MainPipelineTasksMap.entries()) {
      const isIsolated = !tasksWithDependencies.has(name) && !tasksWithDependents.has(name);

      _nodes.push({
        id: `task::${name}`,
        type: "taskNode",
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          name,
          namespace,
          description: task.description,
          displayName: task.displayName,
          taskRef: task.taskRef,
          isFinally: false,
          isIsolated,
        },
        style: {
          width: 180,
          height: 60,
        },
      });
    }

    // Add finally tasks
    for (const [name, task] of FinallyPipelineTasksMap.entries()) {
      _nodes.push({
        id: `task::${name}`,
        type: "taskNode",
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          name,
          namespace,
          description: task.description,
          displayName: task.displayName,
          taskRef: task.taskRef,
          isFinally: true,
          isIsolated: false, // Finally tasks are not considered isolated
        },
        style: {
          width: 180,
          height: 60,
        },
      });
    }

    return _nodes;
  }, [MainPipelineTasksMap, FinallyPipelineTasksMap, noTasks, namespace]);

  const initialEdges = React.useMemo(() => {
    if (noTasks) {
      return [];
    }

    // eslint-disable-next-line prefer-const
    let _edges: MyEdge[] = [];

    // Add edges for main tasks based on runAfter
    for (const [name, task] of MainPipelineTasksMap.entries()) {
      if (!task.runAfter) {
        continue;
      }

      for (const dependency of task.runAfter) {
        _edges.push({
          id: `edge::${dependency}::${name}`,
          source: `task::${dependency}`,
          target: `task::${name}`,
          style: {
            stroke: STATUS_COLOR.UNKNOWN,
            strokeWidth: 2,
          },
          animated: true,
        });
      }
    }

    // Add invisible constraint edges from last main tasks to finally tasks
    if (FinallyPipelineTasksMap.size > 0 && MainPipelineTasksMap.size > 0) {
      // Find tasks that are truly at the end of execution chains
      const tasksWithDependents = new Set<string>();
      const tasksWithDependencies = new Set<string>();

      for (const [taskName, task] of MainPipelineTasksMap.entries()) {
        if (task.runAfter && task.runAfter.length > 0) {
          tasksWithDependencies.add(taskName);
          task.runAfter.forEach((dep) => tasksWithDependents.add(dep));
        }
      }

      // Last tasks: have dependencies but nothing depends on them
      const lastMainTasks = Array.from(MainPipelineTasksMap.keys()).filter(
        (taskName) => tasksWithDependencies.has(taskName) && !tasksWithDependents.has(taskName)
      );

      // Fallback to any tasks without dependents
      let actualLastTasks = lastMainTasks;
      if (actualLastTasks.length === 0) {
        actualLastTasks = Array.from(MainPipelineTasksMap.keys()).filter(
          (taskName) => !tasksWithDependents.has(taskName) && tasksWithDependencies.has(taskName)
        );
      }

      if (actualLastTasks.length === 0) {
        actualLastTasks = Array.from(MainPipelineTasksMap.keys());
      }

      // Create constraint edges (will be filtered out after layout)
      for (const [finallyTaskName] of FinallyPipelineTasksMap.entries()) {
        for (const lastTaskName of actualLastTasks) {
          _edges.push({
            id: `constraint::${lastTaskName}::${finallyTaskName}`,
            source: `task::${lastTaskName}`,
            target: `task::${finallyTaskName}`,
            hidden: true, // Will be filtered out from rendering
          });
        }
      }
    }

    return _edges;
  }, [MainPipelineTasksMap, FinallyPipelineTasksMap, noTasks]);

  // Apply layout to nodes and edges
  const { nodes, edges } = React.useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, direction);
  }, [initialNodes, initialEdges, direction]);

  return { nodes, edges };
};
