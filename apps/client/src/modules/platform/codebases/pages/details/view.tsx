import { CodebaseType, codebaseType, isSystem, systemQuickLink } from "@my-project/shared";
import { usePageTabs } from "./hooks/usePageTabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import React from "react";
import { ErrorContent } from "@/core/components/ErrorContent";
import { routeComponentList } from "../list/route";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ResourcesSVGSprite } from "@/core/k8s/icons/sprites/Resources";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { PageWrapper } from "@/core/components/PageWrapper";
import { QuickLink } from "@/core/components/QuickLink";
import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";
import { getQuickLinkURLsFromList } from "@/core/k8s/api/groups/KRCI/QuickLink/utils/getURLsFromList";
import { Stack } from "@mui/material";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Section } from "@/core/components/Section";
import { LinkCreationService } from "@/core/services/link-creation";
import { quickLinkLabels } from "@/core/k8s/api/groups/KRCI/QuickLink/constants";
import { CodebaseActionsMenu } from "../../components/CodebaseActionsMenu";
import { useDataContext } from "./providers/Data/hooks";
import { useParams } from "@tanstack/react-router";
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
  const params = useParams({
    from: routeComponentDetails.id,
  });

  const { codebaseWatch, quickLinkListWatch } = useDataContext();

  const codebase = codebaseWatch.data;
  const quickLinkList = quickLinkListWatch.dataArray;
  const quickLinksURLs = getQuickLinkURLsFromList(quickLinkList);

  const tabs = usePageTabs();

  const { activeTab, handleChangeTab } = useTabsContext();

  const codebaseIsLoaded = codebaseWatch.isFetched && !codebaseWatch.error;

  const renderPageContent = React.useCallback(() => {
    if (codebaseWatch.error) {
      return <ErrorContent error={codebaseWatch.error} />;
    }

    return (
      <LoadingWrapper isLoading={codebaseWatch.isLoading}>
        <ResourcesSVGSprite />
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [activeTab, codebaseWatch.error, codebaseWatch.isLoading, handleChangeTab, tabs]);

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "codebases",
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
                    label: quickLinkLabels[systemQuickLink.sonar],
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
