import { Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { codebaseType } from "@my-project/shared";
import { EDP_USER_GUIDE } from "@my-project/client/core/k8s/constants/docs-urls";

export const DialogHeader = () => {
  const theme = useTheme();
  const {
    props: { codebase },
  } = useCurrentDialog();

  const docLink = React.useMemo(() => {
    switch (codebase?.spec.type) {
      case codebaseType.application:
        return EDP_USER_GUIDE.APPLICATION_CREATE.url;
      case codebaseType.autotest:
        return EDP_USER_GUIDE.AUTOTEST_CREATE.url;
      case codebaseType.library:
        return EDP_USER_GUIDE.LIBRARY_CREATE.url;
      case codebaseType.infrastructure:
        return EDP_USER_GUIDE.INFRASTRUCTURE_CREATE.url;
      default:
        return EDP_USER_GUIDE.APPLICATION_CREATE.url;
    }
  }, [codebase]);

  return (
    <Stack direction="row" alignItems={"flex-start"} justifyContent={"space-between"} spacing={1}>
      <Stack spacing={2}>
        <Typography
          fontSize={theme.typography.pxToRem(20)}
          fontWeight={500}
        >{`Edit ${codebase?.metadata.name}`}</Typography>
        <LearnMoreLink url={docLink} />
      </Stack>
    </Stack>
  );
};
