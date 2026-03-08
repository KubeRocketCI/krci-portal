import React from "react";
import { LogViewer } from "@/core/components/LogViewer";
import { EmptyList } from "@/core/components/EmptyList";
import { Card } from "@/core/components/ui/card";

/** Time to wait for Tekton Results archival before showing a "not available" message. */
const ARCHIVING_TIMEOUT_MS = 60_000;

/**
 * Shown when a PipelineRun has completed but Tekton Results hasn't
 * archived it yet (completionTime exists, but no resultUid annotation).
 *
 * Includes a 60-second timeout for clusters without Tekton Results,
 * after which a static message replaces the spinner.
 */
export function ArchivingMessage() {
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), ARCHIVING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <Card className="h-full overflow-hidden">
        <EmptyList
          customText="Logs may not be available"
          description="The pipeline has completed, but logs were not archived by Tekton Results. Pod logs may have been garbage-collected."
        />
      </Card>
    );
  }

  return <LogViewer content="" isLoading loadingMessage="Archiving in progress — logs will appear shortly..." />;
}
