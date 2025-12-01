import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { codebaseCreationStrategy, gitProvider } from "@my-project/shared";
import React from "react";

import { Separator } from "@/core/components/ui/separator";
import { SwitchGroup } from "@/core/providers/Form/components/SwitchGroup";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { DefaultBranchField } from "@/modules/platform/codebases/components/form-fields/DefaultBranch";
import { DescriptionField } from "@/modules/platform/codebases/components/form-fields/Description";

import { NameField } from "@/modules/platform/codebases/components/form-fields/Name";
import { FolderGit2 } from "lucide-react";
import { useWatch } from "react-hook-form";
import { NAMES } from "../../names";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { GitServerField } from "@/modules/platform/codebases/components/form-fields/GitServer";
import { GitUrlPathField } from "@/modules/platform/codebases/components/form-fields/GitUrlPath";
import { OwnerField } from "@/modules/platform/codebases/components/form-fields/Owner";
import { RepositoryField } from "@/modules/platform/codebases/components/form-fields/Repository";
import { RepositoryLoginField } from "@/modules/platform/codebases/components/form-fields/RepositoryLogin";
import { RepositoryPasswordOrApiTokenField } from "@/modules/platform/codebases/components/form-fields/RepositoryPasswordOrApiToken";
import { RepositoryUrlField } from "@/modules/platform/codebases/components/form-fields/RepositoryUrl";

const GitPart = () => {
  const { control } = useTypedFormContext();

  const ownerFieldValue = useWatch({ control, name: NAMES.ui_repositoryOwner });
  const repositoryNameFieldValue = useWatch({ control, name: NAMES.ui_repositoryName });
  const gitServerFieldValue = useWatch({ control, name: NAMES.gitServer });
  const gitUrlPathFieldWatch = useWatch({ control, name: NAMES.gitUrlPath });
  const strategyFieldValue = useWatch({ control, name: NAMES.strategy });
  const isCreateFromTemplate = useWatch({ control, name: NAMES.ui_creationMethod }) === "template";

  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;
  const apiBaseUrl = krciConfigMap?.data?.api_gateway_url;

  const gitServersWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });
  const gitServer = gitServersWatch.data;
  const gitServerProvider = gitServer?.spec?.gitProvider;

  const isGerritOrNoApi = gitServerProvider?.includes(gitProvider.gerrit) || !apiBaseUrl;

  const gitUrlPreview = React.useMemo(() => {
    const host = gitServer?.spec?.gitHost || "git.example.com";
    const owner = ownerFieldValue || "org";
    const repo = repositoryNameFieldValue || "repo";
    const gitUrlPath = gitUrlPathFieldWatch || "repo";
    const isGerrit = gitServerFieldValue === gitProvider.gerrit;

    return isGerrit ? `${host}/${gitUrlPath}` : `${host}/${owner}/${repo}`;
  }, [gitServer?.spec?.gitHost, ownerFieldValue, repositoryNameFieldValue, gitServerFieldValue, gitUrlPathFieldWatch]);

  return (
    <>
      {strategyFieldValue === codebaseCreationStrategy.clone && (
        <div>
          <RepositoryUrlField disabled={isCreateFromTemplate} />
        </div>
      )}

      <div className="space-y-4">
        {isGerritOrNoApi ? (
          // Gerrit or no API: Git Server + Git URL Path + Branch
          <div className="grid grid-cols-3 gap-4">
            <GitServerField />
            <GitUrlPathField />
            <DefaultBranchField />
          </div>
        ) : (
          // Other providers: Git Server + Owner + Repository Name + Branch
          <div className="grid grid-cols-4 gap-4">
            <GitServerField />
            <OwnerField />
            <RepositoryField />
            <DefaultBranchField />
          </div>
        )}
        <div className="bg-card col-span-4 space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <FolderGit2 className="text-foreground h-4 w-4" />
            <code className="text-foreground text-sm">{gitUrlPreview}</code>
          </div>
        </div>
      </div>
    </>
  );
};

export const GitAndProjectInfo: React.FC = () => {
  const {
    control,
    formState: { errors },
  } = useTypedFormContext();

  const strategyFieldValue = useWatch({ control, name: NAMES.strategy });
  const isCreateFromTemplate = useWatch({ control, name: NAMES.ui_creationMethod }) === "template";

  return (
    <div className="space-y-4">
      <GitPart />

      <div className="grid grid-cols-4 space-y-4">
        <div className="col-span-2">
          <NameField />
        </div>
        <div className="col-span-4">
          <DescriptionField />
        </div>
      </div>

      <Separator orientation="horizontal" className="my-4" />
      {(strategyFieldValue === codebaseCreationStrategy.create ||
        strategyFieldValue === codebaseCreationStrategy.clone) && (
        <SwitchGroup
          control={control}
          errors={errors}
          items={[
            ...(strategyFieldValue === codebaseCreationStrategy.clone && !isCreateFromTemplate
              ? [
                  {
                    name: NAMES.ui_hasCodebaseAuth,
                    label: "Repository credentials",
                    helperText: "Provide authentication for private repositories",
                    expandableContent: (
                      <div className="grid grid-cols-2 gap-4 rounded-lg">
                        <RepositoryLoginField />
                        <RepositoryPasswordOrApiTokenField />
                      </div>
                    ),
                  },
                ]
              : []),
            {
              name: NAMES.private,
              label: "Private",
              helperText:
                "Leave checked to create a private repository with restricted access (default). Uncheck for a public repository.",
            },
            ...(strategyFieldValue === codebaseCreationStrategy.create
              ? [
                  {
                    name: NAMES.emptyProject,
                    label: "Empty project",
                    helperText:
                      "An empty project does not contain any template code. However, KubeRocketCI pipelines and deployment templates will be created",
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
};
