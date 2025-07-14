import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";
import { Stack, Typography } from "@mui/material";

export const DialogHeader = () => {
  return (
    <Stack direction="row" alignItems={"flex-start"} justifyContent={"space-between"} spacing={1}>
      <Stack spacing={2}>
        <Typography fontSize={(t) => t.typography.pxToRem(20)} fontWeight={500}>
          Create Deployment Flow{" "}
        </Typography>
        <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_CREATE.anchors.CREATE_VIA_UI.url} />
      </Stack>
    </Stack>
  );
};
