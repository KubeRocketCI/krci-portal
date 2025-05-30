import { EDP_USER_GUIDE } from "@my-project/client/core/k8s/constants/docs-urls";
import { useQuickLinkWatchList } from "@my-project/client/core/k8s/api/KRCI/QuickLink";
import { getQuickLinkURLsFromList } from "@my-project/client/core/k8s/api/KRCI/QuickLink/utils/getURLsFromList";
import { arrayFromWatchListQuery } from "@my-project/client/core/k8s/api/hooks/useWatchList";
import { CodebaseType, codebaseType } from "@my-project/shared";
import { usePageTabs } from "./hooks/usePageTabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { usePageParams } from "./hooks/usePageParams";
import { useCodebaseWatchItem } from "@my-project/client/core/k8s/api/KRCI/Codebase";
import React from "react";
import { ErrorContent } from "@/core/components/ErrorContent";
import { routeComponentList } from "../list/route";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ResourcesSVGSprite } from "@/core/k8s/icons/sprites/Resources";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { PageWrapper } from "@/core/components/PageWrapper";
import { QuickLink } from "@/core/components/QuickLink";
import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";

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

export default function codebaseDetailsPage() {
  const params = usePageParams();
  const codebaseWatchQuery = useCodebaseWatchItem(params.name);
  const codebase = codebaseWatchQuery.data;

  const codebaseType = codebase?.spec?.type;
  const quickLinkListWatch= useQuickLinkWatchList();
  const quickLinkList = quickLinkListWatch.dataArray
  const quickLinksURLs = getQuickLinkURLsFromList(quickLinkList);

  const tabs = usePageTabs();

  const { activeTab, handleChangeTab } = useTabsContext();

  const resourceIsLoaded = !codebaseWatchQuery.isLoading && !codebaseWatchQuery.error;

  const renderPageContent = React.useCallback(() => {
    if (codebaseWatchQuery.error) {
      return <ErrorContent error={codebaseWatchQuery.error} />;
    }

    return (
      <LoadingWrapper isLoading={codebaseWatchQuery.isLoading}>
        <ResourcesSVGSprite />
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [activeTab, codebaseWatchQuery.error, codebaseWatchQuery.isLoading, handleChangeTab, tabs]);

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: 'codebases',
          url: {
            pathname: routeComponentList.path,
          },
        },
        {
          label: name,
        },
      ]}
      headerSlot={
        <>
          {resourceIsLoaded && (
            <div style={{ marginLeft: 'auto' }}>
              <Stack spacing={2} direction="row" alignItems="center">
                <QuickLink
                  name={{
                    label: 'git',
                    value: 'git',
                  }}
                  enabledText="Open in GIT"
                  icon={ICONS.SONAR}
                  externalLink={codebase?.status?.gitWebUrl}
                  isTextButton
                />
                <QuickLink
                  name={{
                    label: SYSTEM_QUICK_LINKS_LABELS[SYSTEM_QUICK_LINKS.SONAR],
                    value: SYSTEM_QUICK_LINKS.SONAR,
                  }}
                  enabledText="Open the Quality Gates"
                  icon={ICONS.SONAR}
                  externalLink={LinkCreationService.sonar.createDashboardLink({
                    baseURL: QuickLinksURLS?.[SYSTEM_QUICK_LINKS.SONAR],
                    codebaseName: name,
                  })}
                  configurationLink={{
                    routeName: routeSonar.path,
                  }}
                  isTextButton
                />
                {codebaseType !== CODEBASE_TYPE.SYSTEM && (
                  <ResourceActionListContextProvider>
                    <CodebaseActionsMenu
                      data={{
                        codebaseData: codebase!,
                      }}
                      permissions={permissions}
                      backRoute={Router.createRouteURL(routecodebaseList.path)}
                      variant="inline"
                    />
                  </ResourceActionListContextProvider>
                )}
              </Stack>
            </div>
          )}
        </>
      }
    >
      <Section
        title={name}
        enableCopyTitle
        description={
          <>
            Review {codebase?.spec.type || 'codebase'}, monitor its status, and execute build
            pipelines.{' '}
            <LearnMoreLink url={docLinkByCodebaseType(codebase?.spec.type as CodebaseType)} />
          </>
        }
      >
        {renderPageContent()}
      </Section>
    </PageWrapper>
}
