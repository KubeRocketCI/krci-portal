import { Stack, Typography, useTheme } from "@mui/material";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";

export const DialogHeader = () => {
  const {
    props: { cdPipeline },
  } = useCurrentDialog();

  const theme = useTheme();

  return (
    <Stack direction="row" alignItems={"flex-start"} justifyContent={"space-between"} spacing={1}>
      <Stack spacing={2}>
        <Typography fontSize={theme.typography.pxToRem(20)} fontWeight={500}>
          {`Create Environment for "${cdPipeline?.metadata.name}"`}{" "}
        </Typography>
        <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.anchors.ADD_STAGE.url} />
      </Stack>
    </Stack>
  );
};
