import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { AddNewWidgetCard } from "./components/AddNewWidget";
import { CDPipelinesGraph } from "./components/CDPipelinesGraph";
import { CodebaseBranchesGraph } from "./components/CodebaseBranchesGraph";
import { CodebasesGraph } from "./components/CodebasesGraph";
import { PipelineRunsGraph } from "./components/PipelineRunsGraph";
import { QuickLinkList } from "./components/QuickLinkList";
import { StagesGraph } from "./components/StagesGraph";
import { UserWidgetRenderer } from "./components/UserWidgetsRenderer";
import { useUserWidgets } from "./providers/UserWidgets/hooks";

export default function OverviewDetailsPageContent() {
  const { userWidgets, setUserWidgets } = useUserWidgets();

  return (
    <PageWrapper breadcrumbs={[{ label: "Overview" }]}>
      <div className="flex flex-col gap-12">
        <div>
          <Section
            description={
              <>
                Gain essential information on your codebase insights. Organize your menu for faster and more convenient
                access to different parts of the portal. <LearnMoreLink url={EDP_USER_GUIDE.OVERVIEW.url} />
              </>
            }
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="col-span-1">
                <CodebasesGraph />
              </div>
              <div className="col-span-1">
                <CodebaseBranchesGraph />
              </div>
              <div className="col-span-1">
                <PipelineRunsGraph />
              </div>
              <div className="col-span-1">
                <CDPipelinesGraph />
              </div>
              <div className="col-span-1">
                <StagesGraph />
              </div>
              {userWidgets.map((widget) => {
                return (
                  <div className="col-span-1" key={widget.type}>
                    <UserWidgetRenderer widgetConfig={widget} />
                  </div>
                );
              })}
              <div className="col-span-1">
                <AddNewWidgetCard userWidgets={userWidgets} setUserWidgets={setUserWidgets} />
              </div>
            </div>
          </Section>
        </div>
        <div>
          <Section
            title={<h2 className="text-foreground text-3xl font-semibold">Links</h2>}
            description={"A set of icons with links that redirect you to corresponding tools."}
          >
            <QuickLinkList />
          </Section>
        </div>
      </div>
    </PageWrapper>
  );
}
