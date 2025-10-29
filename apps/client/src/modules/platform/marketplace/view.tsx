import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { IconButton, Paper, Tooltip, useTheme } from "@mui/material";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { TemplateFilter } from "./components/Filter";
import { TemplatesTable } from "./components/TemplatesTable";
import { TemplatesGrid } from "./components/TemplatesGrid";
import { Grid3x2, Rows3 } from "lucide-react";

export default function MarketplacePageContent() {
  const { viewMode, handleChangeViewMode } = useViewModeContext();
  const theme = useTheme();

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
        <div className="flex flex-col gap-3 flex-grow">
          <>
            <K8sRelatedIconsSVGSprite />
            {viewMode === VIEW_MODES.TABLE ? (
              <TemplatesTable />
            ) : (
              <Paper
                variant="outlined"
                elevation={0}
                sx={{ p: (t) => t.typography.pxToRem(20), backgroundColor: "transparent" }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <TemplateFilter />
                    <div className="flex items-center">
                      <Tooltip title={"Block View"}>
                        <IconButton onClick={() => handleChangeViewMode(VIEW_MODES.GRID)} size="large">
                          <Grid3x2 color={theme.palette.primary.main} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={"List View"}>
                        <IconButton onClick={() => handleChangeViewMode(VIEW_MODES.TABLE)} size="large">
                          <Rows3 color={theme.palette.action.active} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                  <TemplatesGrid />
                </div>
              </Paper>
            )}
          </>
        </div>
      </Section>
    </PageWrapper>
  );
}
