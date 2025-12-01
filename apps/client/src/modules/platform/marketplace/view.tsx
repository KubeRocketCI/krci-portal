import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { TemplateFilter } from "./components/Filter";
import { TemplatesTable } from "./components/TemplatesTable";
import { TemplatesGrid } from "./components/TemplatesGrid";
import { Grid3x2, Rows3 } from "lucide-react";

export default function MarketplacePageContent() {
  const { viewMode, handleChangeViewMode } = useViewModeContext();

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Marketplace",
        },
      ]}
    >
      <Section
        description={
          <>
            Effortlessly scaffold applications using predefined templates crafted for various use cases.{" "}
            <LearnMoreLink url={EDP_USER_GUIDE.MARKETPLACE_CREATE_APP.url} />
          </>
        }
      >
        <div className="flex flex-grow flex-col gap-3">
          <>
            {viewMode === VIEW_MODES.TABLE ? (
              <TemplatesTable />
            ) : (
              <div className="border-border rounded border bg-transparent p-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <TemplateFilter />
                    <div className="flex items-center">
                      <Tooltip title={"Block View"}>
                        <Button variant="ghost" size="icon" onClick={() => handleChangeViewMode(VIEW_MODES.GRID)}>
                          <Grid3x2 className="text-primary" />
                        </Button>
                      </Tooltip>
                      <Tooltip title={"List View"}>
                        <Button variant="ghost" size="icon" onClick={() => handleChangeViewMode(VIEW_MODES.TABLE)}>
                          <Rows3 className="text-muted-foreground" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  <TemplatesGrid />
                </div>
              </div>
            )}
          </>
        </div>
      </Section>
    </PageWrapper>
  );
}
