import React from "react";
import { useStore } from "@tanstack/react-form";
import { ciTool as ciToolValues, codebaseType } from "@my-project/shared";
import { NAMES } from "../../names";
import { useCreateCodebaseForm } from "../../providers/form/hooks";
import {
  Lang,
  Framework,
  BuildTool,
  TestReportFramework,
  CodebaseVersioning,
  DeploymentScript,
  CiToolField,
  CommitMessagePattern,
  GitlabCiTemplate,
  JiraServerIntegration,
} from "../fields";

export const BuildConfig: React.FC = () => {
  const form = useCreateCodebaseForm();
  const typeFieldValue = useStore(form.store, (s) => s.values[NAMES.type]);
  const createMethod = useStore(form.store, (s) => s.values[NAMES.ui_creationMethod]);
  const ciToolValue = useStore(form.store, (s) => s.values[NAMES.ciTool]);
  const isCreateFromTemplate = createMethod === "template";
  const helperText = isCreateFromTemplate ? "Set from template" : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Lang disabled={isCreateFromTemplate} helperText={helperText} />
        <Framework disabled={isCreateFromTemplate} helperText={helperText} />
        <BuildTool disabled={isCreateFromTemplate} helperText={helperText} />
      </div>

      {typeFieldValue === codebaseType.autotest && <TestReportFramework />}

      <CodebaseVersioning />

      {typeFieldValue === codebaseType.application && <DeploymentScript />}

      <CiToolField />

      {ciToolValue === ciToolValues.gitlab && <GitlabCiTemplate />}

      <CommitMessagePattern />

      <JiraServerIntegration />
    </div>
  );
};
