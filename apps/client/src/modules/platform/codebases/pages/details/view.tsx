import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageGuideButton } from "@/core/components/PageGuide";
import { QuickLink } from "@/core/components/QuickLink";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { getQuickLinkURLsFromList } from "@/k8s/api/groups/KRCI/QuickLink/utils/getURLsFromList";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { useTours } from "@/modules/tours";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { isSystem, systemQuickLink } from "@my-project/shared";
import { Box, EllipsisVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";
import { CodebaseActionsMenu } from "../../components/CodebaseActionsMenu";
import React from "react";
import { routeProjectList } from "../list/route";
import { useCodebaseWatch } from "./hooks/data";
import { usePageTabs } from "./hooks/usePageTabs";
import { routeProjectDetails, PATH_PROJECT_DETAILS_FULL } from "./route";

export default function CodebaseDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeProjectDetails.useParams();

  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const quickLinkListWatch = useQuickLinkWatchList();

  const quickLinkList = quickLinkListWatch.data.array;
  const quickLinksURLs = getQuickLinkURLsFromList(quickLinkList || []);

  const tabs = usePageTabs();

  const { handleChangeTab } = useTabsContext();
  const { isTourNavigating, currentTourTab } = useTours();

  const codebaseIsLoaded = codebaseWatch.query.isFetched && !codebaseWatch.query.error;
  const showTabs = !codebaseWatch.query.error && !codebaseWatch.query.isLoading;
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Projects",
          route: {
            to: routeProjectList.fullPath,
          },
        },
        {
          label: params.name,
        },
      ]}
      headerSlot={
        <>
          <PageGuideButton tourId="projectDetailsTour" />
        </>
      }
    >
      <PageContentWrapper
        icon={Box}
        title={params.name}
        enableCopyTitle
        pinConfig={{
          key: `project:${params.namespace}/${params.name}`,
          label: params.name,
          type: "project",
          route: {
            to: PATH_PROJECT_DETAILS_FULL,
            params: { clusterName: params.clusterName, namespace: params.namespace, name: params.name },
          },
        }}
        description={`Review ${codebase?.spec.type || "project"}, monitor its status, and execute build pipelines.`}
        actions={
          codebaseIsLoaded &&
          !isSystem(codebase!) && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="More options">
                  Actions
                  <EllipsisVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <CodebaseActionsMenu
                data={{
                  codebase: codebase!,
                }}
                backRoute={{
                  to: routeProjectList.fullPath,
                  params: {
                    clusterName: params.clusterName,
                  },
                }}
                variant="menu"
              />
            </DropdownMenu>
          )
        }
        extraLinks={
          <div className="flex items-center gap-2">
            <QuickLink
              name="Git"
              tooltip="Open in GIT"
              href={codebase?.status?.gitWebUrl}
              display="text"
              variant="link"
              size="xs"
            />
            <QuickLink
              name={quickLinkUiNames[systemQuickLink.sonar]}
              tooltip="Open the Quality Gates"
              href={LinkCreationService.sonar.createDashboardLink({
                baseURL: quickLinksURLs?.[systemQuickLink.sonar],
                codebaseName: params.name,
              })}
              display="text"
              variant="link"
              size="xs"
            />
          </div>
        }
        tabs={showTabs ? tabs : undefined}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
        tabDataTour="project-tabs"
        tourHighlight={{ isNavigating: isTourNavigating, focusedTabId: currentTourTab }}
      >
        {codebaseWatch.query.error && <ErrorContent error={codebaseWatch.query.error} />}
        {codebaseWatch.query.isLoading && <LoadingWrapper isLoading>{null}</LoadingWrapper>}
      </PageContentWrapper>
    </PageWrapper>
  );
}
