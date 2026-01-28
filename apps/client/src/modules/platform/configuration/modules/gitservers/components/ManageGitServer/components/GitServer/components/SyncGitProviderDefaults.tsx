import React from "react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/names";
import { useManageGitServerForm } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/providers/form/hooks";
import { createGitServerSecretName, gitProvider, gitUser } from "@my-project/shared";

/**
 * When GIT_PROVIDER changes, sync GIT_USER and NAME_SSH_KEY_SECRET to the defaults for that provider.
 */
export const SyncGitProviderDefaults = () => {
  const form = useManageGitServerForm();
  const currentProvider = useStore(form.store, (state) => state.values[NAMES.GIT_PROVIDER]);
  const previousRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (currentProvider === undefined) return;
    if (previousRef.current === currentProvider) return;
    previousRef.current = currentProvider;
    const user =
      currentProvider === gitProvider.gerrit
        ? gitUser.GERRIT
        : currentProvider === gitProvider.github
          ? gitUser.GITHUB
          : currentProvider === gitProvider.gitlab
            ? gitUser.GITLAB
            : gitUser.BITBUCKET;
    form.setFieldValue(NAMES.GIT_USER, user);
    form.setFieldValue(NAMES.NAME_SSH_KEY_SECRET, createGitServerSecretName(currentProvider));
  }, [currentProvider, form]);

  return null;
};
