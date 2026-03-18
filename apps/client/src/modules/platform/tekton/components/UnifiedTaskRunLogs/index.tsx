import { ArchivingMessage } from "./components/ArchivingMessage";
import { HistoryStepLogs } from "./components/HistoryStepLogs";
import { LiveStepLogs } from "./components/LiveStepLogs";

interface RunningLogsProps {
  logRoute: "running";
  stepName: string;
  taskRunName: string;
  namespace: string;
}

interface ArchivedLogsProps {
  logRoute: "archived";
  stepName: string;
  taskRunName: string;
  resultUid: string;
  namespace: string;
}

interface ArchivingLogsProps {
  logRoute: "archiving";
}

interface HistoryLogsProps {
  logRoute: "history";
  stepName: string;
  taskRunName: string;
  resultUid: string;
  namespace: string;
}

export type UnifiedTaskRunLogsProps = RunningLogsProps | ArchivedLogsProps | ArchivingLogsProps | HistoryLogsProps;

/**
 * Unified log viewer for TaskRun steps.
 *
 * Routes to the correct log source based on an upfront `logRoute` decision:
 * - **running**: Streams live logs from the pod (only for active pipelines)
 * - **archived**: Completed + archived -> Tekton Results logs
 * - **archiving**: Completed but not yet archived -> spinner with timeout
 * - **history**: From Tekton Results history -> Tekton Results logs directly
 */
export function UnifiedTaskRunLogs(props: UnifiedTaskRunLogsProps) {
  switch (props.logRoute) {
    case "running":
      return <LiveStepLogs stepName={props.stepName} taskRunName={props.taskRunName} namespace={props.namespace} />;

    case "archived":
      return (
        <HistoryStepLogs
          taskRunName={props.taskRunName}
          stepName={props.stepName}
          resultUid={props.resultUid}
          namespace={props.namespace}
          isArchived
        />
      );

    case "archiving":
      return <ArchivingMessage />;

    case "history":
      return (
        <HistoryStepLogs
          taskRunName={props.taskRunName}
          stepName={props.stepName}
          resultUid={props.resultUid}
          namespace={props.namespace}
        />
      );
  }
}
