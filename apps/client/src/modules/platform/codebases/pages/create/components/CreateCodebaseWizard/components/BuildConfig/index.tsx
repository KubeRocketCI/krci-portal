import {
  codebaseType,
  codebaseVersioning,
  codebaseCreationStrategy,
  codebaseTestReportFramework,
  codebaseDeploymentScript,
  ciTool,
} from "@my-project/shared";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../names";
import { useCreateCodebaseForm } from "../../providers/form/hooks";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { CodebaseInterface, CodebaseMappingItemInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { mapObjectValuesToSelectOptions, mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";
import { Alert } from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Trash2 } from "lucide-react";
import z from "zod";

// Advanced mapping options
const advancedMappingBase = [
  { label: "Component/s", value: "components" },
  { label: "FixVersion/s", value: "fixVersions" },
  { label: "Labels", value: "labels" },
];

// Convert array format to JSON string
const getJiraIssueMetadataPayload = (rows: Array<{ field: string; pattern: string }>): string | null => {
  const buffer = rows.reduce<Record<string, string>>((acc, { field, pattern }) => {
    if (pattern.trim()) {
      acc[field] = pattern;
    }
    return acc;
  }, {});

  return Object.keys(buffer).length > 0 ? JSON.stringify(buffer) : null;
};

export const BuildConfig: React.FC = () => {
  const form = useCreateCodebaseForm();

  // Subscribe to form values using useStore (replaces useWatch)
  const typeFieldValue = useStore(form.store, (state) => state.values[NAMES.type]);
  const langFieldValue = useStore(form.store, (state) => state.values[NAMES.lang]);
  const strategyFieldValue = useStore(form.store, (state) => state.values[NAMES.strategy]);
  const createMethod = useStore(form.store, (state) => state.values[NAMES.ui_creationMethod]);
  const gitServerFieldValue = useStore(form.store, (state) => state.values[NAMES.gitServer]);
  const versioningTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.versioningType]);
  const versioningStartFromVersion = useStore(form.store, (state) => state.values[NAMES.ui_versioningStartFromVersion]);
  const versioningStartFromSnapshot = useStore(
    form.store,
    (state) => state.values[NAMES.ui_versioningStartFromSnapshot]
  );
  const hasJiraServerIntegration = useStore(
    form.store,
    (state) => state.values[NAMES.ui_hasJiraServerIntegration] ?? false
  );
  const mappingRows = useStore(
    form.store,
    (state) => (state.values[NAMES.ui_advancedMappingRows] as Array<{ field: string; pattern: string }>) || []
  );
  const selectedFields = useStore(
    form.store,
    (state) => (state.values[NAMES.ui_advancedMappingFieldName] as string[]) || []
  );

  const isCreateFromTemplate = createMethod === "template";
  const isOtherLanguage = langFieldValue === CODEBASE_COMMON_LANGUAGES.OTHER;

  // Get codebase mapping for lang/framework/buildTool options
  const codebaseMapping = React.useMemo(() => {
    if (!typeFieldValue) return null;
    return getCodebaseMappingByType(typeFieldValue);
  }, [typeFieldValue]);

  const lang = langFieldValue?.toLowerCase();
  const codebaseMappingByLang = React.useMemo(() => {
    if (!codebaseMapping || !lang) return null;
    // Type-safe access: codebaseMapping is a record with language keys
    return (codebaseMapping as Record<string, CodebaseInterface>)[lang];
  }, [codebaseMapping, lang]);

  // Lang options
  const langOptions = React.useMemo(() => {
    if (!codebaseMapping) return [];

    const resultOptions: Array<{ value: string; label: string; disabled?: boolean; icon?: React.ReactNode }> = [];

    for (const mapping of Object.values(codebaseMapping)) {
      const {
        language: { name, value, icon },
      } = mapping;

      const isDisabled =
        value === CODEBASE_COMMON_LANGUAGES.OTHER && strategyFieldValue === codebaseCreationStrategy.create;

      resultOptions.push({
        value,
        label: name,
        disabled: isDisabled,
        icon: icon ? <UseSpriteSymbol name={icon} width={32} height={32} /> : undefined,
      });
    }

    return resultOptions;
  }, [codebaseMapping, strategyFieldValue]);

  // Framework options
  const frameworkOptions = React.useMemo(() => {
    if (!codebaseMappingByLang) return [];

    const resultOptions: Array<{ value: string; label: string; icon?: React.ReactNode }> = [];

    for (const framework of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.frameworks)) {
      const { name, value, icon } = framework;
      resultOptions.push({
        value,
        label: name,
        icon: icon ? <UseSpriteSymbol name={icon} width={32} height={32} /> : undefined,
      });
    }

    return resultOptions;
  }, [codebaseMappingByLang]);

  // BuildTool options
  const buildToolOptions = React.useMemo(() => {
    if (!codebaseMappingByLang) return [];

    const resultOptions: Array<{ value: string; label: string; icon?: React.ReactNode }> = [];

    for (const buildTool of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.buildTools)) {
      const { name, value, icon } = buildTool;
      resultOptions.push({
        value,
        label: name,
        icon: icon ? <UseSpriteSymbol name={icon} width={32} height={32} /> : undefined,
      });
    }

    return resultOptions;
  }, [codebaseMappingByLang]);

  // Git servers for CiTool
  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;
  const selectedGitServer = gitServers.find((gitServer) => gitServer.metadata.name === gitServerFieldValue);
  const isGitlabProvider = selectedGitServer?.spec.gitProvider === "gitlab";

  const ciToolOptions = React.useMemo(
    () => [
      { label: "Tekton", value: ciTool.tekton },
      ...(isGitlabProvider ? [{ label: "GitLab CI", value: ciTool.gitlab }] : []),
    ],
    [isGitlabProvider]
  );

  // Jira servers
  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;
  const jiraServersNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);
  const hasNoJiraServers = !jiraServerList.length;

  // Advanced mapping options
  const advancedMappingOptions = React.useMemo(
    () =>
      advancedMappingBase.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    []
  );

  // Update jira payload when mapping rows change
  const updateJiraPayload = React.useCallback(
    (rows: Array<{ field: string; pattern: string }>) => {
      const jsonPayload = getJiraIssueMetadataPayload(rows);
      form.setFieldValue(NAMES.jiraIssueMetadataPayload, jsonPayload);
    },
    [form]
  );

  // Handle mapping field changes
  const handleMappingFieldChanges = React.useCallback(
    (newFields: string[]) => {
      const currentRows = form.getFieldValue(NAMES.ui_advancedMappingRows) || [];
      const prevFields = (currentRows as Array<{ field: string; pattern: string }>).map((row) => row.field);

      // Find added fields
      const addedFields = newFields.filter((field) => !prevFields.includes(field));

      // Find removed fields
      const removedFields = prevFields.filter((field) => !newFields.includes(field));

      // Create new rows array
      let newRows = [...(currentRows as Array<{ field: string; pattern: string }>)];

      // Add new fields
      addedFields.forEach((field) => {
        newRows.push({ field, pattern: "" });
      });

      // Remove deselected fields
      newRows = newRows.filter((row) => !removedFields.includes(row.field));

      // Update form values
      form.setFieldValue(NAMES.ui_advancedMappingRows, newRows);
      updateJiraPayload(newRows);
    },
    [form, updateJiraPayload]
  );

  // Handle pattern blur
  const handlePatternBlur = React.useCallback(() => {
    const currentRows = form.getFieldValue(NAMES.ui_advancedMappingRows) || [];
    updateJiraPayload(currentRows as Array<{ field: string; pattern: string }>);
  }, [form, updateJiraPayload]);

  // Handle delete mapping row
  const handleDeleteMappingRow = React.useCallback(
    (index: number) => {
      const currentRows = form.getFieldValue(NAMES.ui_advancedMappingRows) || [];
      const rowToRemove = (currentRows as Array<{ field: string; pattern: string }>)[index];

      if (rowToRemove) {
        const newRows = (currentRows as Array<{ field: string; pattern: string }>).filter((_, idx) => idx !== index);
        const newSelectedFields = selectedFields.filter((field) => field !== rowToRemove.field);

        form.setFieldValue(NAMES.ui_advancedMappingRows, newRows);
        form.setFieldValue(NAMES.ui_advancedMappingFieldName, newSelectedFields);
        updateJiraPayload(newRows);
      }
    },
    [form, selectedFields, updateJiraPayload]
  );

  const capitalizedCodebaseType = typeFieldValue ? capitalizeFirstLetter(typeFieldValue) : "";

  return (
    <div className="space-y-4">
      {/* Lang, Framework, BuildTool */}
      <div className="grid grid-cols-3 gap-4">
        <form.AppField
          name={NAMES.lang}
          validators={{
            onChange: z.string().min(1, "Select codebase language"),
          }}
          listeners={{
            onChange: () => {
              // Reset framework and buildTool when lang changes
              form.setFieldValue(NAMES.framework, "");
              form.setFieldValue(NAMES.buildTool, "");
            },
          }}
        >
          {(field) => (
            <field.FormCombobox
              label={`${capitalizedCodebaseType} code language`}
              tooltipText="Specify the primary programming language used in your component."
              options={langOptions}
              placeholder="Select or enter language..."
              disabled={isCreateFromTemplate}
              helperText={isCreateFromTemplate ? "Set from template" : undefined}
            />
          )}
        </form.AppField>

        {isOtherLanguage ? (
          <form.AppField
            name={NAMES.framework}
            validators={{
              onChange: z
                .string()
                .min(1, "Select or enter language version/framework")
                .max(8, "You exceeded the maximum length of 8")
                .regex(/[a-z]/, "Invalid language version/framework name: [a-z]"),
            }}
          >
            {(field) => (
              <field.FormTextField
                label="Language version/framework"
                tooltipText="Indicate the version of the programming language or framework your component relies on."
                placeholder="Enter framework"
                disabled={isCreateFromTemplate || !langFieldValue}
                helperText={isCreateFromTemplate ? "Set from template" : undefined}
              />
            )}
          </form.AppField>
        ) : (
          <form.AppField
            name={NAMES.framework}
            validators={{
              onChange: z.string().min(1, "Select or enter language version/framework"),
            }}
          >
            {(field) => (
              <field.FormCombobox
                label="Language version/framework"
                tooltipText="Indicate the version of the programming language or framework your component relies on."
                options={frameworkOptions}
                placeholder="Select or enter framework..."
                disabled={isCreateFromTemplate || !langFieldValue}
                helperText={isCreateFromTemplate ? "Set from template" : undefined}
              />
            )}
          </form.AppField>
        )}

        {isOtherLanguage ? (
          <form.AppField
            name={NAMES.buildTool}
            validators={{
              onChange: z
                .string()
                .min(1, "Select or enter build tool")
                .max(8, "You exceeded the maximum length of 8")
                .regex(/[a-z]/, "Invalid build tool name: [a-z]"),
            }}
          >
            {(field) => (
              <field.FormTextField
                label="Build tool"
                tooltipText="Choose the build tool your project uses. This information is crucial for accurate build pipeline configuration."
                placeholder="Enter build tool"
                disabled={isCreateFromTemplate || !langFieldValue}
                helperText={isCreateFromTemplate ? "Set from template" : undefined}
              />
            )}
          </form.AppField>
        ) : (
          <form.AppField
            name={NAMES.buildTool}
            validators={{
              onChange: z.string().min(1, "Select or enter build tool"),
            }}
          >
            {(field) => (
              <field.FormCombobox
                label="Build tool"
                tooltipText="Choose the build tool your project uses. This information is crucial for accurate build pipeline configuration."
                options={buildToolOptions}
                placeholder="Select or enter build tool..."
                disabled={isCreateFromTemplate || !langFieldValue}
                helperText={isCreateFromTemplate ? "Set from template" : undefined}
              />
            )}
          </form.AppField>
        )}
      </div>

      {/* TestReportFramework (autotest only) */}
      {typeFieldValue === codebaseType.autotest && (
        <form.AppField
          name={NAMES.testReportFramework}
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Select autotest report framework";
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FormSelect
              label="Autotest report framework"
              options={mapObjectValuesToSelectOptions(codebaseTestReportFramework)}
            />
          )}
        </form.AppField>
      )}

      {/* CodebaseVersioning */}
      <div className="grid grid-cols-3 gap-4">
        <form.AppField
          name={NAMES.versioningType}
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Select codebase versioning type";
              return undefined;
            },
          }}
          listeners={{
            onChange: ({ value }) => {
              if (
                (value === codebaseVersioning.edp || value === codebaseVersioning.semver) &&
                !versioningStartFromVersion &&
                !versioningStartFromSnapshot
              ) {
                form.setFieldValue(NAMES.ui_versioningStartFromVersion, "0.0.0");
                form.setFieldValue(NAMES.ui_versioningStartFromSnapshot, "SNAPSHOT");
                form.setFieldValue(NAMES.versioningStartFrom, "0.0.0-SNAPSHOT");
              }
            },
          }}
        >
          {(field) => (
            <field.FormSelect
              label="Codebase versioning type"
              tooltipText="Define the versioning strategy for source code and artifacts."
              options={mapObjectValuesToSelectOptions(codebaseVersioning)}
            />
          )}
        </form.AppField>

        {(versioningTypeFieldValue === codebaseVersioning.edp ||
          versioningTypeFieldValue === codebaseVersioning.semver) && (
          <>
            <form.AppField
              name={NAMES.ui_versioningStartFromVersion}
              validators={{
                onChange: z
                  .string()
                  .min(1, "Specify the initial version.")
                  .regex(
                    /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/,
                    "Enter valid semantic versioning format"
                  ),
              }}
              listeners={{
                onBlur: () => {
                  const version = form.getFieldValue(NAMES.ui_versioningStartFromVersion) || "";
                  const snapshot = versioningStartFromSnapshot || "";
                  form.setFieldValue(NAMES.versioningStartFrom, `${version}-${snapshot}`);
                },
              }}
            >
              {(field) => (
                <field.FormTextField
                  label="Start version from"
                  tooltipText="Define the initial version number or identifier for your codebase to mark the starting point for version control."
                  placeholder="0.0.0"
                />
              )}
            </form.AppField>
            <form.AppField
              name={NAMES.ui_versioningStartFromSnapshot}
              validators={{
                onChange: z.string().min(1, "Add a suffix."),
              }}
              listeners={{
                onBlur: () => {
                  const version = versioningStartFromVersion || "";
                  const snapshot = form.getFieldValue(NAMES.ui_versioningStartFromSnapshot) || "";
                  form.setFieldValue(NAMES.versioningStartFrom, `${version}-${snapshot}`);
                },
              }}
            >
              {(field) => (
                <field.FormTextField
                  placeholder="SNAPSHOT"
                  label="Suffix"
                  tooltipText="Add a suffix to your version name to provide categorization. E.g. SNAPSHOT, unstable, test."
                />
              )}
            </form.AppField>
          </>
        )}
      </div>

      {/* DeploymentScript (application only) */}
      {typeFieldValue === codebaseType.application && (
        <form.AppField
          name={NAMES.deploymentScript}
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Select the deployment script";
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FormSelect
              label="Deployment Options"
              tooltipText={
                <>
                  Select the deployment approach that best suits your target environment:
                  <ul>
                    <li>
                      <strong>Helm</strong>: Deploy applications within Kubernetes clusters.
                    </li>
                    <li>
                      <strong>RPM</strong>: Install applications on RPM-based Linux distributions.
                    </li>
                  </ul>
                </>
              }
              options={Object.values(codebaseDeploymentScript).map((script) => ({
                label: script,
                value: script,
              }))}
            />
          )}
        </form.AppField>
      )}

      {/* CiTool */}
      <form.AppField name={NAMES.ciTool}>
        {(field) => <field.FormSelect label="CI Pipelines" options={ciToolOptions} disabled={!isGitlabProvider} />}
      </form.AppField>

      {/* CommitMessagePattern */}
      <form.AppField name={NAMES.commitMessagePattern}>
        {(field) => (
          <field.FormTextField
            label="Specify the pattern to validate a commit message"
            tooltipText={
              <>
                <p>Define a regular expression pattern to validate commit messages.</p>
                <p>This ensures consistency in your version control history. For example, use a pattern like</p>
                <p>"^(feat|fix|docs|style|refactor|test|chore): [A-Za-z]."</p>
              </>
            }
            placeholder="^\\[PROJECT_NAME-\\d{4}\\]:.*"
          />
        )}
      </form.AppField>

      {/* JiraServerIntegration */}
      <div className={hasNoJiraServers ? "flex gap-4" : "w-full"}>
        {hasNoJiraServers && (
          <div className="w-1/2">
            <Alert variant="default">There are no available Jira servers</Alert>
          </div>
        )}
        <div className={hasNoJiraServers ? "w-1/2" : "w-full"}>
          <form.AppField name={NAMES.ui_hasJiraServerIntegration}>
            {(field) => (
              <field.FormSwitch
                label="Integrate with Jira server"
                helperText="Enable this to integrate with Jira server. This will allow you to create Jira issues from the codebase."
                disabled={jiraServerListWatch.isEmpty}
                rich
                expandableContent={
                  hasJiraServerIntegration ? (
                    <div className="flex flex-col gap-4">
                      <form.AppField
                        name={NAMES.jiraServer}
                        validators={{
                          onChange: ({ value }) => {
                            if (!value) return "Select Jira server that will be integrated with the codebase.";
                            return undefined;
                          },
                        }}
                      >
                        {(field) => (
                          <field.FormSelect
                            label="Jira server"
                            tooltipText="Select the Jira server to link your component with relevant project tasks."
                            options={mapArrayToSelectOptions(jiraServersNames)}
                          />
                        )}
                      </form.AppField>
                      <form.AppField
                        name={NAMES.ticketNamePattern}
                        validators={{
                          onChange: ({ value }) => {
                            if (!value) return "Specify the pattern to find a Jira ticket number in a commit message.";
                            return undefined;
                          },
                        }}
                      >
                        {(field) => (
                          <field.FormTextField
                            label="Specify the pattern to find a Jira ticket number in a commit message"
                            tooltipText={
                              <>
                                <p>
                                  Set a regular expression pattern to identify Jira ticket numbers in commit messages.
                                </p>
                                <p>
                                  This facilitates seamless integration with your issue tracking system. An example
                                  pattern could be
                                </p>
                                <p>&quot;(JIRA|jira|Issue|issue) [A-Z]+-[0-9]+&quot;</p>
                              </>
                            }
                            placeholder="PROJECT_NAME-\d{4}"
                          />
                        )}
                      </form.AppField>
                      <div className="flex flex-col gap-4">
                        <form.AppField
                          name={NAMES.ui_advancedMappingFieldName}
                          listeners={{
                            onChange: ({ value }) => handleMappingFieldChanges(value as string[]),
                          }}
                        >
                          {(field) => (
                            <field.FormCombobox
                              label="Mapping field name"
                              tooltipText={
                                <div>
                                  <p>
                                    There are four predefined variables with the respective values that can be specified
                                    singly or as a combination: <br />
                                  </p>
                                  <ul>
                                    <li>
                                      <b>QUICK_LINK</b> – returns application-name <br />
                                    </li>
                                    <li>
                                      <b>EDP_VERSION</b> – returns <b>0.0.0-SNAPSHOT</b> or <b>0.0.0-RC</b> <br />
                                    </li>
                                    <li>
                                      <b>EDP_SEM_VERSION</b> – returns <b>0.0.0</b> <br />
                                    </li>
                                    <li>
                                      <b>EDP_GITTAG</b> – returns <b>build/0.0.0-SNAPSHOT.2</b> or{" "}
                                      <b>build/0.0.0-RC.2</b> <br />
                                    </li>
                                  </ul>
                                  <em>
                                    There are no character restrictions when combining the variables, combination
                                    samples:
                                    <b>EDP_SEM_VERSION-QUICK_LINK</b> or <b>QUICK_LINK-hello-world/EDP_VERSION</b>, etc.
                                  </em>
                                </div>
                              }
                              options={advancedMappingOptions}
                              placeholder="Select mapping fields"
                              multiple
                            />
                          )}
                        </form.AppField>
                        <div>
                          <div className="flex flex-col gap-4">
                            {mappingRows.length > 0 ? (
                              <>
                                {mappingRows.map((rowData, idx) => {
                                  const mappingItem = advancedMappingBase.find((item) => item.value === rowData.field);
                                  if (!mappingItem) return null;

                                  return (
                                    <div key={rowData.field}>
                                      <div className="flex items-center gap-4">
                                        <div className="grow">
                                          <Input disabled value={mappingItem.label} className="w-full" />
                                        </div>
                                        <div className="grow">
                                          <form.AppField
                                            name={
                                              `${NAMES.ui_advancedMappingRows}[${idx}].pattern` as "ui_advancedMappingRows"
                                            }
                                            validators={{
                                              onChange: ({ value }) => {
                                                if (!value) return "Add at least one variable.";
                                                return undefined;
                                              },
                                            }}
                                            listeners={{
                                              onBlur: handlePatternBlur,
                                            }}
                                          >
                                            {(field) => <field.FormTextField placeholder="Enter Jira pattern" />}
                                          </form.AppField>
                                        </div>
                                        <div className="shrink">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="min-w-0"
                                            onClick={() => handleDeleteMappingRow(idx)}
                                          >
                                            <Trash2 size={20} className="text-muted-foreground" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            ) : (
                              <div className="border-input flex h-[70px] items-center justify-center rounded border border-dashed p-4">
                                <p className="text-muted-foreground text-sm">
                                  Select mapping fields from the dropdown above to configure Jira patterns.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null
                }
              />
            )}
          </form.AppField>
        </div>
      </div>
    </div>
  );
};
