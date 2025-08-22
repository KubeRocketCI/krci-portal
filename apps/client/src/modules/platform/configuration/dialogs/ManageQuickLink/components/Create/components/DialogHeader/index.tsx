import { Stack, Typography, useTheme } from "@mui/material";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export const DialogHeader = () => {
  const theme = useTheme();

  return (
    <Stack direction="row" alignItems={"flex-start"} justifyContent={"space-between"} spacing={1}>
      <Stack spacing={2}>
        <Typography fontSize={theme.typography.pxToRem(20)} fontWeight={500}>
          Create Link
        </Typography>
        <LearnMoreLink url={EDP_USER_GUIDE.OVERVIEW.url} />
      </Stack>
    </Stack>
  );
};
