import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/core/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { IssueSeverity } from "@my-project/shared";
import { ServerSideTable } from "@/core/components/ServerSideTable";
import { useProjectIssues } from "../../hooks/useProjectIssues";
import { useIssuesColumns } from "../../hooks/useIssuesColumns";
import { IssueFilters } from "./IssueFilters";
import { IssueDetailContent } from "./IssueDetailContent";
import { ISSUE_TYPES, ISSUE_TYPE_TABS, IssueTypeTab, ISSUES_PAGE_SIZE } from "./constants";
import { routeSASTProjectDetails } from "../../route";
import { router } from "@/core/router";
import { PATH_SAST_PROJECT_DETAILS_FULL } from "../../route";

interface IssuesSectionProps {
  projectKey: string;
}

export function IssuesSection({ projectKey }: IssuesSectionProps) {
  const params = routeSASTProjectDetails.useParams();
  const search = routeSASTProjectDetails.useSearch();

  // Convert from 1-indexed URL page to 0-indexed table page
  const urlPage = search.page;
  const page = urlPage !== undefined ? urlPage - 1 : 0;

  const [selectedTab, setSelectedTab] = useState<IssueTypeTab>(ISSUE_TYPES.ALL);
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(new Set());

  const queryParams = {
    componentKeys: projectKey,
    resolved: "false" as const,
    types: selectedTab === ISSUE_TYPES.ALL ? undefined : selectedTab,
    severities: severityFilter.length > 0 ? severityFilter.join(",") : undefined,
    p: page + 1, // SonarQube uses 1-indexed pages
    ps: ISSUES_PAGE_SIZE,
  };

  const { data, isLoading, error } = useProjectIssues(queryParams);
  const columns = useIssuesColumns(data?.components);

  const handlePageChange = useCallback(
    (newPage: number) => {
      // Convert from 0-indexed table page to 1-indexed URL page
      const urlPage = newPage + 1;
      router.navigate({
        to: PATH_SAST_PROJECT_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, page: urlPage }),
      });
    },
    [params]
  );

  const handleTabChange = (value: string) => {
    setSelectedTab(value as IssueTypeTab);
    handlePageChange(0);
    // Clear expanded rows when changing tabs
    setExpandedRowIds(new Set());
  };

  const handleSeveritiesChange = (severities: IssueSeverity[]) => {
    setSeverityFilter(severities);
    handlePageChange(0);
    // Clear expanded rows when changing filters
    setExpandedRowIds(new Set());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList>
            {ISSUE_TYPE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ServerSideTable
          id="sast-issues-table"
          data={data?.issues || []}
          columns={columns}
          isLoading={isLoading}
          blockerError={error ? new Error("Failed to load issues. Please try again later.") : null}
          expandable={{
            getRowId: (issue) => issue.key,
            expandedRowIds,
            onExpandedRowsChange: setExpandedRowIds,
            expandedRowRender: (issue) => <IssueDetailContent issue={issue} components={data?.components} />,
          }}
          slots={{
            header: <IssueFilters severities={severityFilter} onSeveritiesChange={handleSeveritiesChange} />,
          }}
          pagination={{
            show: true,
            page,
            rowsPerPage: ISSUES_PAGE_SIZE,
            totalCount: data?.total || 0,
            onPageChange: handlePageChange,
            onRowsPerPageChange: () => {},
          }}
          settings={{
            show: true,
          }}
          outlined={false}
        />
      </CardContent>
    </Card>
  );
}
