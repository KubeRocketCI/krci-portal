import { AdvancedJiraMappingField } from "@/modules/platform/codebases/components/form-fields/AdvancedJiraMapping";
import { BuildToolField } from "@/modules/platform/codebases/components/form-fields/BuildTool";
import { CiToolField } from "@/modules/platform/codebases/components/form-fields/CiTool";
import { CodebaseVersioningField } from "@/modules/platform/codebases/components/form-fields/CodebaseVersioning";
import { CommitMessagePatternField } from "@/modules/platform/codebases/components/form-fields/CommitMessagePattern";
import { DeploymentScriptField } from "@/modules/platform/codebases/components/form-fields/DeploymentScript";
import { FrameworkField } from "@/modules/platform/codebases/components/form-fields/Framework";
import { JiraServerField } from "@/modules/platform/codebases/components/form-fields/JiraServer";
import { JiraServerIntegrationField } from "@/modules/platform/codebases/components/form-fields/JiraServerIntegration";
import { LangField } from "@/modules/platform/codebases/components/form-fields/Lang";
import { TestReportFrameworkField } from "@/modules/platform/codebases/components/form-fields/TestReportFramework";
import { TicketNamePatternField } from "@/modules/platform/codebases/components/form-fields/TicketNamePattern";
import { codebaseType } from "@my-project/shared";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../names";

export const BuildConfig: React.FC = () => {
  const { watch } = useFormContext();
  const typeFieldValue = watch(NAMES.type);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <LangField />
        <FrameworkField />
        <BuildToolField />
      </div>
      {typeFieldValue === codebaseType.autotest && <TestReportFrameworkField />}
      <CodebaseVersioningField />

      {typeFieldValue === codebaseType.application && <DeploymentScriptField />}
      <CiToolField />
      <CommitMessagePatternField />
      <JiraServerIntegrationField
        expandableContent={
          <div className="flex flex-col gap-4">
            <JiraServerField />
            <TicketNamePatternField />
            <AdvancedJiraMappingField />
          </div>
        }
      />
    </div>
  );
};
