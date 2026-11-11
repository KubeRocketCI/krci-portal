import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import { TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { cn } from "@/core/utils/classname";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { SecurityCounts } from "@/modules/platform/security/components/defectdojo/SecurityCounts";
import { FOCUS_RING_CLASS, ICON_LINK_CLASS } from "@/modules/platform/security/components/defectdojo/utils";
import { COLLAPSED_ENTRY_COUNT, type EntryRow } from "../../utils";
import { VersionList } from "./VersionList";

interface RouteContext {
  clusterName: string;
  namespace: string;
}

interface SecurityEntryListProps extends RouteContext {
  title: string;
  /** Ordered by severity. */
  entries: EntryRow[];
}

const BODY_CLASS = "block @4xl:table-row-group";

const NAME_TEXT_CLASS = "text-foreground text-sm font-medium";

function EntryName({ entry, clusterName, namespace }: { entry: EntryRow } & RouteContext) {
  if (!entry.stage) {
    return <TextWithTooltip text={entry.label} className={NAME_TEXT_CLASS} />;
  }

  const stageLinkParams = { clusterName, namespace, ...entry.stage };

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Link
        to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
        params={stageLinkParams}
        className={cn(FOCUS_RING_CLASS, "hover:text-primary min-w-0 underline-offset-2 hover:underline")}
      >
        <TextWithTooltip text={entry.label} className={NAME_TEXT_CLASS} />
      </Link>
      <Link
        to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
        params={stageLinkParams}
        aria-label={`Open stage ${entry.label}`}
        className={cn(ICON_LINK_CLASS, "shrink-0")}
      >
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function EntryRowItem({ entry, clusterName, namespace }: { entry: EntryRow } & RouteContext) {
  return (
    <TableRowUI className="flex flex-wrap items-center @4xl:table-row">
      <TableCellUI className="w-full min-w-0 px-3 py-2 @4xl:w-auto">
        <EntryName entry={entry} clusterName={clusterName} namespace={namespace} />
        <VersionList versions={entry.versions} />
      </TableCellUI>
      <TableCellUI className="px-3 py-2">
        <SecurityCounts counts={entry.counts} showLabels />
      </TableCellUI>
      <TableCellUI className="ml-auto px-3 py-2 text-right @4xl:ml-0">
        <DefectDojoLink href={entry.link} label={`Open ${entry.label} in DefectDojo`} />
      </TableCellUI>
    </TableRowUI>
  );
}

/** Entries of one section, most severe first: the first COLLAPSED_ENTRY_COUNT, the rest behind "Show all (N)". */
export function SecurityEntryList({ title, entries, clusterName, namespace }: SecurityEntryListProps) {
  const [isOpen, setIsOpen] = useState(false);

  const firstEntries = entries.slice(0, COLLAPSED_ENTRY_COUNT);
  const restEntries = entries.slice(COLLAPSED_ENTRY_COUNT);
  const renderEntry = (entry: EntryRow) => (
    <EntryRowItem key={entry.key} entry={entry} clusterName={clusterName} namespace={namespace} />
  );

  return (
    <Card className="@container p-5">
      <section aria-label={title}>
        <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          {title}
          <Badge variant="neutral" className="tabular-nums">
            {entries.length}
          </Badge>
        </h4>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className={cn(isOpen && restEntries.length > 0 && "max-h-[480px] overflow-y-auto")}>
            <table className="block w-full text-sm @4xl:table @4xl:table-fixed">
              <caption className="sr-only">{title}: findings by severity</caption>
              <TableHeaderUI className="bg-card sticky top-0 z-10 hidden @4xl:table-header-group">
                <TableRowUI className="hover:bg-transparent">
                  <TableHeadUI className="text-muted-foreground px-3 py-2 text-xs font-medium">Name</TableHeadUI>
                  <TableHeadUI className="text-muted-foreground w-[34rem] px-3 py-2 text-xs font-medium">
                    Findings
                  </TableHeadUI>
                  <TableHeadUI className="w-12 px-3 py-2">
                    <span className="sr-only">DefectDojo</span>
                  </TableHeadUI>
                </TableRowUI>
              </TableHeaderUI>
              <tbody className={BODY_CLASS}>{firstEntries.map(renderEntry)}</tbody>
              {restEntries.length > 0 && (
                <CollapsibleContent asChild>
                  <tbody className={BODY_CLASS}>{restEntries.map(renderEntry)}</tbody>
                </CollapsibleContent>
              )}
            </table>
          </div>
          {restEntries.length > 0 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2">
                {isOpen ? `Show first ${COLLAPSED_ENTRY_COUNT}` : `Show all (${entries.length})`}
              </Button>
            </CollapsibleTrigger>
          )}
        </Collapsible>
      </section>
    </Card>
  );
}
