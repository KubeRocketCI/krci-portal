import { Grid, styled } from "@mui/material";
import { AddNewQuickLinkCard } from "./components/AddNewQuickLinkCard";
import { ComponentCard } from "./components/ComponentCard";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";

const StyledGrid = styled(Grid)`
  ${(props) => props.theme.breakpoints.up("xl")} {
    flex: 1 0 20% !important;
    max-width: 20% !important;
  }
`;

const StyledGridItem = styled(Grid)`
  ${(props) => props.theme.breakpoints.up("xl")} {
    flex: 1 0 20% !important;
    max-width: 20% !important;
  }
`;

export const QuickLinkList = () => {
  const quickLinkListWatch = useQuickLinkWatchList();
  const quickLinkList = quickLinkListWatch.data.array;

  return quickLinkListWatch.query.error ? (
    <ErrorContent error={quickLinkListWatch.query.error} outlined />
  ) : (
    <LoadingWrapper isLoading={quickLinkListWatch.query.isFetching}>
      <Grid container spacing={3}>
        {quickLinkList.map((el) => {
          return el.spec.visible ? (
            <StyledGrid item xs={4} sm={3} xl={"auto"} key={el.metadata.uid}>
              <ComponentCard component={el} />
            </StyledGrid>
          ) : null;
        })}
        <StyledGridItem item xs={4} sm={3} xl={"auto"}>
          <AddNewQuickLinkCard />
        </StyledGridItem>
      </Grid>
    </LoadingWrapper>
  );
};
