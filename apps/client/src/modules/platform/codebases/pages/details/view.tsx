import { ErrorContent } from "@/core/components/ErrorContent";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { QuickLink } from "@/core/components/QuickLink";
import { Section } from "@/core/components/Section";
import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { getQuickLinkURLsFromList } from "@/k8s/api/groups/KRCI/QuickLink/utils/getURLsFromList";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { Stack } from "@mui/material";
import { CodebaseType, codebaseType, isSystem, systemQuickLink } from "@my-project/shared";
import React from "react";
import { CodebaseActionsMenu } from "../../components/CodebaseActionsMenu";
import { routeComponentList } from "../list/route";
import { useCodebaseWatch } from "./hooks/data";
import { usePageTabs } from "./hooks/usePageTabs";
import { routeComponentDetails } from "./route";

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
  const params = routeComponentDetails.useParams();

  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const quickLinkListWatch = useQuickLinkWatchList();

  const quickLinkList = quickLinkListWatch.dataArray;
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
        <K8sRelatedIconsSVGSprite />
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [activeTab, codebaseWatch.query.error, codebaseWatch.query.isLoading, handleChangeTab, tabs]);

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Components",
          route: {
            to: routeComponentList.fullPath,
          },
        },
        {
          label: params.name,
        },
      ]}
      headerSlot={
        <>
          {codebaseIsLoaded && (
            <div style={{ marginLeft: "auto" }}>
              <Stack spacing={2} direction="row" alignItems="center">
                <QuickLink
                  name={{
                    label: "git",
                    value: "git",
                  }}
                  enabledText="Open in GIT"
                  externalLink={codebase?.status?.gitWebUrl}
                  isTextButton
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
                />
                {!isSystem(codebase!) && (
                  <ResourceActionListContextProvider>
                    <CodebaseActionsMenu
                      data={{
                        codebase: codebase!,
                      }}
                      backRoute={{
                        to: routeComponentList.fullPath,
                        params: {
                          clusterName: params.clusterName,
                        },
                      }}
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
        title={params.name}
        enableCopyTitle
        description={
          <>
            Review {codebase?.spec.type || "codebase"}, monitor its status, and execute build pipelines.{" "}
            <LearnMoreLink url={docLinkByCodebaseType(codebase?.spec.type)} />
          </>
        }
      >
        {renderPageContent()}
      </Section>
    </PageWrapper>
  );
}
