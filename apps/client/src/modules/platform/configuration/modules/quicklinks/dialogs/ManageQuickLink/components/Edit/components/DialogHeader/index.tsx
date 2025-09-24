import { Stack, Typography, useTheme } from "@mui/material";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";

export const DialogHeader = () => {
  const {
    props: { quickLink },
  } = useCurrentDialog();

  const theme = useTheme();

  return (
    <Stack direction="row" alignItems={"flex-start"} justifyContent={"space-between"} spacing={1}>
      <Stack spacing={2}>
        <Typography fontSize={theme.typography.pxToRem(20)} fontWeight={500}>
          {`Edit ${quickLink?.metadata.name}`}
        </Typography>
      </Stack>
    </Stack>
  );
};
