import React from "react";
import { useStore } from "@tanstack/react-form";
import { codebaseCreationStrategy, gitProvider } from "@my-project/shared";
import { Separator } from "@/core/components/ui/separator";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { FolderGit2 } from "lucide-react";
import { NAMES } from "../../names";
import { useCreateCodebaseForm } from "../../providers/form/hooks";
import {
  RepositoryUrl,
  GitServer,
  GitUrlPath,
  Owner,
  RepositoryName,
  DefaultBranch,
  Name,
  Description,
  RepositoryCredentials,
  Private,
  EmptyProject,
} from "../fields";

const GitUrlPreview: React.FC = () => {
  const form = useCreateCodebaseForm();
  const ownerFieldValue = useStore(form.store, (s) => s.values[NAMES.ui_repositoryOwner]);
  const repositoryNameFieldValue = useStore(form.store, (s) => s.values[NAMES.ui_repositoryName]);
  const gitServerFieldValue = useStore(form.store, (s) => s.values[NAMES.gitServer]);
  const gitUrlPathFieldValue = useStore(form.store, (s) => s.values[NAMES.gitUrlPath]);

  const gitServerWatch = useGitServerWatchItem({ name: gitServerFieldValue });
  const gitServer = gitServerWatch.data;

  const preview = React.useMemo(() => {
    const host = gitServer?.spec?.gitHost || "git.example.com";
    const owner = ownerFieldValue || "org";
    const repo = repositoryNameFieldValue || "repo";
    const gitUrlPath = gitUrlPathFieldValue || "repo";
    const isGerrit = gitServerFieldValue === gitProvider.gerrit;
    return isGerrit ? `${host}/${gitUrlPath}` : `${host}/${owner}/${repo}`;
  }, [gitServer?.spec?.gitHost, ownerFieldValue, repositoryNameFieldValue, gitServerFieldValue, gitUrlPathFieldValue]);

  return (
    <div className="bg-card col-span-4 space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <FolderGit2 className="text-foreground h-4 w-4" />
        <code className="text-foreground text-sm">{preview}</code>
      </div>
    </div>
  );
};

const GitPart: React.FC = () => {
  const form = useCreateCodebaseForm();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[NAMES.gitServer]);
  const strategyFieldValue = useStore(form.store, (s) => s.values[NAMES.strategy]);
  const isCreateFromTemplate = useStore(form.store, (s) => s.values[NAMES.ui_creationMethod] === "template");

  const gitServerWatch = useGitServerWatchItem({ name: gitServerFieldValue });
  const gitServerProvider = gitServerWatch.data?.spec?.gitProvider;
  const isGerritOrNoApi = gitServerProvider?.includes(gitProvider.gerrit);

  return (
    <>
      {strategyFieldValue === codebaseCreationStrategy.clone && (
        <div>
          <RepositoryUrl disabled={isCreateFromTemplate} />
        </div>
      )}

      <div className="space-y-4">
        {isGerritOrNoApi ? (
          <div className="grid grid-cols-3 gap-4">
            <GitServer />
            <GitUrlPath />
            <DefaultBranch />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <GitServer />
            <Owner />
            <RepositoryName />
            <DefaultBranch />
          </div>
        )}
        <GitUrlPreview />
      </div>
    </>
  );
};

export const GitAndProjectInfo: React.FC = () => {
  const form = useCreateCodebaseForm();
  const strategyFieldValue = useStore(form.store, (s) => s.values[NAMES.strategy]);
  const isCreateFromTemplate = useStore(form.store, (s) => s.values[NAMES.ui_creationMethod] === "template");

  return (
    <div className="space-y-4">
      <GitPart />

      <div className="grid grid-cols-4 space-y-4">
        <div className="col-span-2">
          <Name />
        </div>
        <div className="col-span-4">
          <Description />
        </div>
      </div>

      <Separator orientation="horizontal" className="my-4" />

      {(strategyFieldValue === codebaseCreationStrategy.create ||
        strategyFieldValue === codebaseCreationStrategy.clone) && (
        <fieldset className="w-full space-y-4">
          <ul className="flex w-full flex-col divide-y rounded-md border">
            {strategyFieldValue === codebaseCreationStrategy.clone && !isCreateFromTemplate && (
              <li>
                <div className="p-3">
                  <RepositoryCredentials />
                </div>
              </li>
            )}
            <li>
              <div className="p-3">
                <Private />
              </div>
            </li>
            {strategyFieldValue === codebaseCreationStrategy.create && (
              <li>
                <div className="p-3">
                  <EmptyProject />
                </div>
              </li>
            )}
          </ul>
        </fieldset>
      )}
    </div>
  );
};
