import { Grid } from "@mui/material";
import { codebaseBranchStatus, codebaseVersioning } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import {
  BranchName,
  BranchVersion,
  BuildPipeline,
  DefaultBranchVersion,
  FromCommit,
  ReleaseBranch,
  ReleaseBranchName,
  ReviewPipeline,
} from "../../../fields";

export const Form = () => {
  const {
    props: { codebase, defaultBranch },
  } = useCurrentDialog();

  const { watch } = useTypedFormContext();

  const defaultBranchVersion = defaultBranch?.spec.version;

  const canCreateReleaseBranch = React.useMemo(
    () =>
      (codebase.spec.versioning.type === codebaseVersioning.edp ||
        codebase.spec.versioning.type === codebaseVersioning.semver) &&
      defaultBranch?.status?.status === codebaseBranchStatus.created,
    [codebase.spec.versioning.type, defaultBranch]
  );

  const releaseFieldValue = watch(CODEBASE_BRANCH_FORM_NAMES.release.name);

  return (
    <>
      <Grid container spacing={2}>
        {canCreateReleaseBranch && (
          <Grid item xs={12}>
            <ReleaseBranch defaultBranchVersion={defaultBranchVersion!} />
          </Grid>
        )}
        {releaseFieldValue ? (
          <Grid item xs={12}>
            <ReleaseBranchName defaultBranchVersion={defaultBranchVersion!} />
          </Grid>
        ) : (
          <Grid item xs={12}>
            <BranchName defaultBranchVersion={defaultBranchVersion!} />
          </Grid>
        )}
        <Grid item xs={12}>
          <FromCommit />
        </Grid>
        {canCreateReleaseBranch && (
          <>
            <Grid item xs={12}>
              <BranchVersion />
            </Grid>
            {!!releaseFieldValue && (
              <Grid item xs={12}>
                <DefaultBranchVersion />
              </Grid>
            )}
          </>
        )}
        <Grid item xs={12}>
          <ReviewPipeline />
        </Grid>
        <Grid item xs={12}>
          <BuildPipeline />
        </Grid>
      </Grid>
    </>
  );
};
