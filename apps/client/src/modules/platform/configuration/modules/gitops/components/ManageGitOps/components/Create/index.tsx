import { Box, Grid, Stack, useTheme } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { CODEBASE_FORM_NAMES } from "../../names";
import { ManageGitOpsValues } from "../../types";
import { CiTool, GitRepoPath, GitServer, Name } from "../fields";
import { FolderPlus, CloudDownload } from "lucide-react";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { gitProvider } from "@my-project/shared";
import { TileRadioGroup } from "@/core/providers/Form/components/MainRadioGroup";

const codebaseCreationStrategies = [
  {
    value: "create",
    label: "Create",
    description: "Create a new base repository.",
    icon: <FolderPlus size={24} color="#002446" />,
    checkedIcon: <FolderPlus size={24} color="#002446" />,
  },
  {
    value: "import",
    label: "Import",
    description: "Onboard your existing repository.",
    icon: <CloudDownload size={24} color="#002446" />,
    checkedIcon: <CloudDownload size={24} color="#002446" />,
  },
];
export const Create = () => {
  const { watch } = useFormContext<ManageGitOpsValues>();
  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.GIT_SERVER);

  const gitServerWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });

  const gitServer = gitServerWatch.query.data;

  const gitServerProvider = gitServer?.spec.gitProvider;

  const theme = useTheme();

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Stack spacing={2}>
      <TileRadioGroup
        {...register(CODEBASE_FORM_NAMES.STRATEGY)}
        control={control}
        errors={errors}
        options={codebaseCreationStrategies}
        gridItemSize={4}
      />

      <Box sx={{ p: `${theme.typography.pxToRem(24)} ${theme.typography.pxToRem(8)}` }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <GitServer />
          </Grid>
          <Grid item xs={6}>
            <CiTool />
          </Grid>
          {gitServerProvider !== gitProvider.gerrit && !!gitServerWatch.isReady && (
            <Grid item xs={9}>
              <GitRepoPath />
            </Grid>
          )}
          <Grid item xs={3}>
            <Name />
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );
};
