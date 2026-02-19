import { ErrorContent } from "@/core/components/ErrorContent";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { QuickLink } from "@/core/components/QuickLink";
import { Section } from "@/core/components/Section";
import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { getQuickLinkURLsFromList } from "@/k8s/api/groups/KRCI/QuickLink/utils/getURLsFromList";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { CodebaseType, codebaseType, isSystem, systemQuickLink } from "@my-project/shared";
import { Box } from "lucide-react";
import React from "react";
import { CodebaseActionsMenu } from "../../components/CodebaseActionsMenu";
import { routeProjectList } from "../list/route";
import { useCodebaseWatch } from "./hooks/data";
import { usePageTabs } from "./hooks/usePageTabs";
import { routeProjectDetails, PATH_PROJECT_DETAILS_FULL } from "./route";

const docLinkByCodebaseType = (type: CodebaseType | undefined) => {
  switch (type) {
    case codebaseType.application:
      return EDP_USER_GUIDE.APPLICATION_MANAGE.url;
    case codebaseType.autotest:
      return EDP_USER_GUIDE.AUTOTEST_MANAGE.url;
    case codebaseType.library:
      return EDP_USER_GUIDE.LIBRARY_MANAGE.url;
    case codebaseType.infrastructure:
      return EDP_USER_GUIDE.INFRASTRUCTURE_MANAGE.url;

    default:
      return EDP_USER_GUIDE.APPLICATION_MANAGE.url;
  }
};

export default function CodebaseDetailsPageContent() {
  const params = routeProjectDetails.useParams();

  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const quickLinkListWatch = useQuickLinkWatchList();

  const quickLinkList = quickLinkListWatch.data.array;
  const quickLinksURLs = getQuickLinkURLsFromList(quickLinkList || []);

  const tabs = usePageTabs();

  const { activeTab, handleChangeTab } = useTabsContext();

  const codebaseIsLoaded = codebaseWatch.query.isFetched && !codebaseWatch.query.error;

  const renderPageContent = React.useCallback(() => {
    if (codebaseWatch.query.error) {
      return <ErrorContent error={codebaseWatch.query.error} />;
    }

    return (
      <LoadingWrapper isLoading={codebaseWatch.query.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [activeTab, codebaseWatch.query.error, codebaseWatch.query.isLoading, handleChangeTab, tabs]);

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
      headerSlot={<LearnMoreLink url={docLinkByCodebaseType(codebase?.spec.type)} />}
    >
      <Section
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
              variant="inline"
            />
          )
        }
        extraContent={
          <div className="flex items-center gap-2">
            <QuickLink
              name={{
                label: "Git",
                value: "git",
              }}
              enabledText="Open in GIT"
              externalLink={codebase?.status?.gitWebUrl}
              isTextButton
              variant="link"
            />
            <QuickLink
              name={{
                label: quickLinkUiNames[systemQuickLink.sonar],
                value: systemQuickLink.sonar,
              }}
              enabledText="Open the Quality Gates"
              externalLink={LinkCreationService.sonar.createDashboardLink({
                baseURL: quickLinksURLs?.[systemQuickLink.sonar],
                codebaseName: params.name,
              })}
              isTextButton
              variant="link"
            />
          </div>
        }
      >
        {renderPageContent()}
      </Section>
    </PageWrapper>
  );
}
