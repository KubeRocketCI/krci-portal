import { ApprovalTask, approvalTaskLabels, PipelineTask, Task, TaskRun, taskRunLabels } from "@my-project/shared";
import type { PipelineRunTaskData } from "./data";

export const findTaskForPipelineTask = (tasks: Task[], pipelineTask: PipelineTask): Task | undefined => {
	return tasks.find((task) => task.metadata?.name === pipelineTask?.taskRef?.name);
};

export const findTaskRunForPipelineTask = (taskRuns: TaskRun[], pipelineTask: PipelineTask): TaskRun | undefined => {
	return taskRuns.find((taskRun) => taskRun.metadata?.labels?.[taskRunLabels.pipelineTask] === pipelineTask?.name);
};

export const findApprovalTaskForPipelineTask = (
	approvalTasks: ApprovalTask[],
	pipelineTask: PipelineTask
): ApprovalTask | undefined => {
	return approvalTasks.find(
		(approvalTask) => approvalTask.metadata?.labels?.[approvalTaskLabels.pipelineTask] === pipelineTask?.name
	);
};

export const buildPipelineRunTasksByNameMap = (params: {
	allPipelineTasks: PipelineTask[];
	tasks: Task[];
	taskRuns: TaskRun[];
	approvalTasks: ApprovalTask[];
}): Map<string, PipelineRunTaskData> => {
	const { allPipelineTasks, tasks, taskRuns, approvalTasks } = params;
	return allPipelineTasks.reduce((acc, pipelineTask) => {
		acc.set(pipelineTask.name!, {
			pipelineRunTask: pipelineTask,
			task: findTaskForPipelineTask(tasks, pipelineTask) as Task,
			taskRun: findTaskRunForPipelineTask(taskRuns, pipelineTask) as TaskRun,
			approvalTask: findApprovalTaskForPipelineTask(approvalTasks, pipelineTask) as ApprovalTask,
		});
		return acc;
	}, new Map<string, PipelineRunTaskData>());
};
