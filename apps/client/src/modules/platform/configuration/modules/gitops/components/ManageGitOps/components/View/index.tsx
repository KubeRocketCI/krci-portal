import { Grid } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { CODEBASE_FORM_NAMES } from "../../names";
import { ManageGitOpsValues } from "../../types";
import { GitRepoPath, GitServer, Name } from "../fields";
import { gitProvider } from "@my-project/shared";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";

export const View = () => {
  const { watch } = useFormContext<ManageGitOpsValues>();

  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.GIT_SERVER);

  const gitServerWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });

  const gitServer = gitServerWatch.query.data;

  const gitServerProvider = gitServer?.spec.gitProvider;

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <GitServer />
        </Grid>
        {gitServerProvider !== gitProvider.gerrit && !!gitServerWatch.isReady && (
          <Grid item xs={5}>
            <GitRepoPath />
          </Grid>
        )}
        <Grid item xs={3}>
          <Name />
        </Grid>
      </Grid>
    </>
  );
};
