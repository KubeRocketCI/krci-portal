import React from "react";
import { useForm } from "react-hook-form";
import { SHARED_FORM_NAMES } from "../names";
import { SharedFormValues } from "../types";
import { GitServer, gitProvider, gitUser } from "@my-project/shared";

export const useSharedForm = ({ gitServer }: { gitServer: GitServer | undefined }) => {
  const defaultValues = React.useMemo(() => {
    const _gitProvider = gitServer?.spec.gitProvider || gitProvider.gerrit;
    const _gitUser = (() => {
      switch (_gitProvider) {
        case gitProvider.gerrit:
          return gitUser.GERRIT;
        case gitProvider.github:
          return gitUser.GITHUB;
        case gitProvider.gitlab:
          return gitUser.GITLAB;
        case gitProvider.bitbucket:
          return gitUser.BITBUCKET;
      }
    })();

    return {
      [SHARED_FORM_NAMES.GIT_PROVIDER]: _gitProvider,
      [SHARED_FORM_NAMES.GIT_USER]: _gitUser,
    };
  }, [gitServer]);

  const form = useForm<SharedFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  return React.useMemo(() => ({ form }), [form]);
};
