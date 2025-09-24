import { Grid, Tooltip, Typography } from "@mui/material";
import React from "react";
import { useFormsContext } from "../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../names";
import { SSHPrivateKey, SSHPublicKey, Token } from "./components/fields";
import { createGitServerSecretName, GitProvider, gitProvider } from "@my-project/shared";
import { ShieldX } from "lucide-react";
import { useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";

export const CredentialsForm = () => {
  const { sharedForm } = useFormsContext();

  const gitProviderSharedValue = sharedForm.watch(GIT_SERVER_FORM_NAMES.GIT_PROVIDER);

  const gitServerSecretWatch = useSecretWatchItem({
    name: createGitServerSecretName((gitProviderSharedValue as GitProvider) || ""),
  });

  const gitServerSecret = gitServerSecretWatch.query.data;

  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  const sharedGitProviderValue = sharedForm.watch(GIT_SERVER_FORM_NAMES.GIT_PROVIDER);

  const secretFieldsRenderer = React.useCallback(() => {
    switch (sharedGitProviderValue) {
      case gitProvider.gerrit:
        return (
          <>
            <Grid item xs={12}>
              <SSHPrivateKey />
            </Grid>
            <Grid item xs={12}>
              <SSHPublicKey />
            </Grid>
          </>
        );
      case gitProvider.github:
        return (
          <>
            <Grid item xs={12}>
              <SSHPrivateKey />
            </Grid>
            <Grid item xs={12}>
              <Token />
            </Grid>
          </>
        );
      case gitProvider.gitlab:
        return (
          <>
            <Grid item xs={12}>
              <SSHPrivateKey />
            </Grid>
            <Grid item xs={12}>
              <Token />
            </Grid>
          </>
        );
      case gitProvider.bitbucket:
        return (
          <>
            <Grid item xs={12}>
              <SSHPrivateKey />
            </Grid>
            <Grid item xs={12}>
              <Token />
            </Grid>
          </>
        );
    }
  }, [sharedGitProviderValue]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={1} alignItems={"center"}>
          <Grid item>
            <Typography variant={"h6"}>Credentials</Typography>
          </Grid>
          {!!gitServerSecretOwnerReference && (
            <Grid item>
              <Tooltip title={`Managed by ${gitServerSecretOwnerReference}`}>
                <ShieldX size={20} />
              </Tooltip>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {secretFieldsRenderer()}
        </Grid>
      </Grid>
    </Grid>
  );
};
