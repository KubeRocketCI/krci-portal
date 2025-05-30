import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useTypedFormContext } from "@/modules/platform/codebases/dialogs/ManageCodebase/hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "@/modules/platform/codebases/dialogs/ManageCodebase/names";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { codebaseType } from "@my-project/shared";
import { Pencil } from "lucide-react";
import React from "react";
import { DialogHeaderProps } from "./types";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";

export const DialogHeader = ({ handleOpenEditor }: DialogHeaderProps) => {
  const theme = useTheme();
  const { watch } = useTypedFormContext();

  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name) as string;
  const capitalizedType = capitalizeFirstLetter(typeFieldValue);
  const docLink = React.useMemo(() => {
    switch (typeFieldValue) {
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
  }, [typeFieldValue]);

  return (
    <Stack direction="row" alignItems={"flex-start"} justifyContent={"space-between"} spacing={1}>
      <Stack spacing={2}>
        <Typography fontSize={theme.typography.pxToRem(20)} fontWeight={500}>{`Create ${capitalizedType}`}</Typography>
        <LearnMoreLink url={docLink} />
      </Stack>
      <Box sx={{ color: theme.palette.text.primary }}>
        <Button
          startIcon={<Pencil size={16} />}
          size="small"
          component={"button"}
          color="inherit"
          onClick={handleOpenEditor}
          sx={{ flexShrink: 0 }}
        >
          Edit YAML
        </Button>
      </Box>
    </Stack>
  );
};
