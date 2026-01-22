import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { codebaseCreationStrategy, gitProvider } from "@my-project/shared";
import React from "react";

import { Separator } from "@/core/components/ui/separator";
import { useGitServerWatchItem, useGitServerWatchList, getGitServerStatusIcon } from "@/k8s/api/groups/KRCI/GitServer";
import { FolderGit2 } from "lucide-react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../names";
import { useCreateCodebaseForm } from "../../providers/form/hooks";
import z from "zod";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

const GitPart = () => {
  const form = useCreateCodebaseForm();
  const trpc = useTRPCClient();

  // Subscribe to form values using useStore (replaces useWatch)
  const ownerFieldValue = useStore(form.store, (state) => state.values[NAMES.ui_repositoryOwner]);
  const repositoryNameFieldValue = useStore(form.store, (state) => state.values[NAMES.ui_repositoryName]);
  const gitServerFieldValue = useStore(form.store, (state) => state.values[NAMES.gitServer]);
  const gitUrlPathFieldValue = useStore(form.store, (state) => state.values[NAMES.gitUrlPath]);
  const strategyFieldValue = useStore(form.store, (state) => state.values[NAMES.strategy]);
  const isCreateFromTemplate = useStore(form.store, (state) => state.values[NAMES.ui_creationMethod] === "template");

  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;
  const apiBaseUrl = krciConfigMap?.data?.api_gateway_url;

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const gitServerWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });
  const gitServer = gitServerWatch.data;
  const gitServerProvider = gitServer?.spec?.gitProvider;

  const isGerritOrNoApi = gitServerProvider?.includes(gitProvider.gerrit) || !apiBaseUrl;

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  // Fetch organizations for Owner field
  const ownerQuery = useQuery({
    queryKey: ["gitServerOrgList", gitServerFieldValue],
    queryFn: () =>
      trpc.gitfusion.getOrganizationList.query({
        gitServer: gitServerFieldValue ?? "",
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: !!apiBaseUrl && !!gitServerFieldValue,
  });

  const organizationsOptions = React.useMemo(() => {
    if (ownerQuery.isLoading || ownerQuery.isError || !ownerQuery.data) {
      return [];
    }
    return (
      ownerQuery.data.data?.map(({ name }: { name: string }) => ({
        label: name,
        value: name,
      })) || []
    );
  }, [ownerQuery.data, ownerQuery.isError, ownerQuery.isLoading]);

  const gitServersOptions = React.useMemo(
    () =>
      gitServers.map((gitServer) => {
        const statusIcon = getGitServerStatusIcon(gitServer);
        return {
          label: gitServer.metadata.name,
          value: gitServer.metadata.name,
          disabled: !gitServer.status?.connected,
          icon: <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} />,
        };
      }),
    [gitServers]
  );

  const gitUrlPreview = React.useMemo(() => {
    const host = gitServer?.spec?.gitHost || "git.example.com";
    const owner = ownerFieldValue || "org";
    const repo = repositoryNameFieldValue || "repo";
    const gitUrlPath = gitUrlPathFieldValue || "repo";
    const isGerrit = gitServerFieldValue === gitProvider.gerrit;

    return isGerrit ? `${host}/${gitUrlPath}` : `${host}/${owner}/${repo}`;
  }, [gitServer?.spec?.gitHost, ownerFieldValue, repositoryNameFieldValue, gitServerFieldValue, gitUrlPathFieldValue]);

  const ownerHelperText = React.useMemo(() => {
    if (!apiBaseUrl) {
      return "Owners auto-discovery cannot be performed.";
    }
    if (ownerQuery.isError) {
      return "Owners auto-discovery could not be performed.";
    }
    return "";
  }, [apiBaseUrl, ownerQuery.isError]);

  return (
    <>
      {strategyFieldValue === codebaseCreationStrategy.clone && (
        <div>
          <form.AppField
            name={NAMES.repositoryUrl}
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined;
                const urlPattern = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)[\w.@/~-]+\w/;
                if (!urlPattern.test(value)) {
                  return "Specify the application URL in the following format: http(s)://git.example.com/example.";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.FormTextField
                label="Repository URL"
                placeholder="http(s)://git.example.com/example"
                disabled={isCreateFromTemplate}
              />
            )}
          </form.AppField>
        </div>
      )}

      <div className="space-y-4">
        {isGerritOrNoApi ? (
          // Gerrit or no API: Git Server + Git URL Path + Branch
          <div className="grid grid-cols-3 gap-4">
            <form.AppField
              name={NAMES.gitServer}
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Select an existing Git server";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.FormSelect
                  label="Git server"
                  tooltipText="Choose the Git server for hosting your repository."
                  options={gitServersOptions}
                />
              )}
            </form.AppField>
            <form.AppField
              name={NAMES.gitUrlPath}
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.length < 3) {
                    return "Repository name has to be at least 3 characters long.";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => <field.FormTextField label="Git URL Path" placeholder="Enter repository path" />}
            </form.AppField>
            <form.AppField
              name={NAMES.defaultBranch}
              validators={{
                onChange: z
                  .string()
                  .min(1, "Specify a branch to work in.")
                  .regex(/^[a-z0-9][a-z0-9/\-.]*[a-z0-9]$/, "Enter valid default branch name"),
              }}
            >
              {(field) => <field.FormTextField label="Default Branch" placeholder="main" />}
            </form.AppField>
          </div>
        ) : (
          // Other providers: Git Server + Owner + Repository Name + Branch
          <div className="grid grid-cols-4 gap-4">
            <form.AppField
              name={NAMES.gitServer}
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Select an existing Git server";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.FormSelect
                  label="Git server"
                  tooltipText="Choose the Git server for hosting your repository."
                  options={gitServersOptions}
                />
              )}
            </form.AppField>
            <form.AppField
              name={NAMES.ui_repositoryOwner}
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Select owner";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.FormCombobox
                  label="Owner"
                  placeholder="owner"
                  options={organizationsOptions}
                  freeSolo
                  loading={!!apiBaseUrl && ownerQuery.isLoading}
                  helperText={ownerHelperText}
                />
              )}
            </form.AppField>
            <form.AppField
              name={NAMES.ui_repositoryName}
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Enter the repository name";
                  }
                  if (value.length < 3) {
                    return "Repository name must be at least 3 characters long";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => <field.FormTextField label="Repository Name" placeholder="Enter repository name" />}
            </form.AppField>
            <form.AppField
              name={NAMES.defaultBranch}
              validators={{
                onChange: z
                  .string()
                  .min(1, "Specify a branch to work in.")
                  .regex(/^[a-z0-9][a-z0-9/\-.]*[a-z0-9]$/, "Enter valid default branch name"),
              }}
            >
              {(field) => <field.FormTextField label="Default Branch" placeholder="main" />}
            </form.AppField>
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
  const form = useCreateCodebaseForm();

  // Subscribe to form values using useStore (replaces useWatch)
  const strategyFieldValue = useStore(form.store, (state) => state.values[NAMES.strategy]);
  const isCreateFromTemplate = useStore(form.store, (state) => state.values[NAMES.ui_creationMethod] === "template");
  const hasCodebaseAuth = useStore(form.store, (state) => state.values[NAMES.ui_hasCodebaseAuth] ?? false);

  return (
    <div className="space-y-4">
      <GitPart />

      <div className="grid grid-cols-4 space-y-4">
        <div className="col-span-2">
          <form.AppField
            name={NAMES.name}
            validators={{
              onChange: z
                .string()
                .min(2, "Component name must be not less than two characters long.")
                .max(30, "Component name must be less than 30 characters long.")
                .regex(/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/, {
                  message:
                    "Component name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces",
                }),
            }}
          >
            {(field) => <field.FormTextField label="Component Name" placeholder="Enter component name" />}
          </form.AppField>
        </div>
        <div className="col-span-4">
          <form.AppField
            name={NAMES.description}
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return "Enter component description";
                }
                return undefined;
              },
            }}
          >
            {(field) => <field.FormTextarea label="Description" placeholder="Enter component description" rows={3} />}
          </form.AppField>
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
                  <form.AppField name={NAMES.ui_hasCodebaseAuth}>
                    {(field) => (
                      <field.FormSwitch
                        label="Repository credentials"
                        helperText="Provide authentication for private repositories"
                        rich
                        variant="list"
                        expandableContent={
                          hasCodebaseAuth ? (
                            <div className="grid grid-cols-2 gap-4 rounded-lg">
                              <form.AppField
                                name={NAMES.ui_repositoryLogin}
                                validators={{
                                  onChange: ({ value }) => {
                                    if (!value || value.trim().length === 0) {
                                      return "Enter repository login";
                                    }
                                    if (!/\w/.test(value)) {
                                      return "Enter valid repository login";
                                    }
                                    return undefined;
                                  },
                                }}
                              >
                                {(field) => <field.FormTextField label="Repository Login" placeholder="Enter login" />}
                              </form.AppField>
                              <form.AppField
                                name={NAMES.ui_repositoryPasswordOrApiToken}
                                validators={{
                                  onChange: ({ value }) => {
                                    if (!value || value.trim().length === 0) {
                                      return "Enter the repository password or access token";
                                    }
                                    if (!/\w/.test(value)) {
                                      return "Enter valid repository password or api token";
                                    }
                                    return undefined;
                                  },
                                }}
                              >
                                {(field) => (
                                  <field.FormTextField
                                    label="Password or API Token"
                                    placeholder="Enter password or token"
                                    type="password"
                                  />
                                )}
                              </form.AppField>
                            </div>
                          ) : null
                        }
                      />
                    )}
                  </form.AppField>
                </div>
              </li>
            )}
            <li>
              <div className="p-3">
                <form.AppField name={NAMES.private}>
                  {(field) => (
                    <field.FormSwitch
                      label="Private"
                      helperText="Leave checked to create a private repository with restricted access (default). Uncheck for a public repository."
                      rich
                      variant="list"
                    />
                  )}
                </form.AppField>
              </div>
            </li>
            {strategyFieldValue === codebaseCreationStrategy.create && (
              <li>
                <div className="p-3">
                  <form.AppField name={NAMES.emptyProject}>
                    {(field) => (
                      <field.FormSwitch
                        label="Empty project"
                        helperText="An empty project does not contain any template code. However, KubeRocketCI pipelines and deployment templates will be created"
                        rich
                        variant="list"
                      />
                    )}
                  </form.AppField>
                </div>
              </li>
            )}
          </ul>
        </fieldset>
      )}
    </div>
  );
};
