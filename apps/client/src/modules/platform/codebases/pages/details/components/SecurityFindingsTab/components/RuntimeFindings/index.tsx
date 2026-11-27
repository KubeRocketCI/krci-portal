import { runtimeContainerRef, totalOf, type CodebaseFindingsInput, type RuntimeEnvironment } from "@my-project/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { RUNTIME_REPORT_KIND_LABELS } from "@/modules/platform/security/components/defectdojo/constants";
import type { RunningContainer } from "../../types";
import { containerLabel } from "../../utils";
import { ScanFindings } from "../ScanFindings";

export interface RuntimeFindingsProps {
  codebase: CodebaseFindingsInput;
  environment: RuntimeEnvironment;
  container: RunningContainer;
}

/** Each tab is the findings of one DefectDojo test. */
export function RuntimeFindings({ codebase, environment, container }: RuntimeFindingsProps) {
  const { vulnerabilities, secrets } = container;
  const reports = [
    {
      kind: "vulnerabilityreport",
      label: RUNTIME_REPORT_KIND_LABELS.vulnerabilityreport,
      data: vulnerabilities && {
        ...vulnerabilities,
        active: totalOf(vulnerabilities.counts),
      },
    },
    { kind: "exposedsecretreport", label: RUNTIME_REPORT_KIND_LABELS.exposedsecretreport, data: secrets },
  ] as const;
  const firstReport = reports.find(({ data }) => data !== null);

  if (!firstReport) {
    return <p className="text-muted-foreground p-3 text-sm">DefectDojo holds no report of this container.</p>;
  }

  return (
    <Tabs defaultValue={firstReport.kind}>
      <TabsList aria-label={`Reports of ${containerLabel(environment, container)}`}>
        {reports.map(({ kind, label, data }) => (
          <TabsTrigger
            key={kind}
            value={kind}
            disabled={data === null}
            title={data === null ? `${container.container} has no ${label.toLowerCase()} report` : undefined}
          >
            {data === null ? label : `${label} (${data.active})`}
          </TabsTrigger>
        ))}
      </TabsList>
      {reports.map(
        ({ kind, label, data }) =>
          data && (
            <TabsContent key={kind} value={kind}>
              <ScanFindings
                codebase={codebase}
                scan={{
                  ref: runtimeContainerRef(environment, container, kind),
                  triaged: data.triaged,
                  testUrl: data.testUrl,
                  productUrl: container.productUrl,
                  date: container.date,
                }}
                title={`${containerLabel(environment, container)}, ${label.toLowerCase()}`}
              />
            </TabsContent>
          )
      )}
    </Tabs>
  );
}
