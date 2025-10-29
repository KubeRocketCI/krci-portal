import {
  DefaultBranch,
  DeploymentScript,
  CodebaseVersioning,
  CommitMessagePattern,
  JiraServerIntegration,
  JiraServer,
  TicketNamePattern,
  AdvancedJiraMapping,
} from "@/modules/platform/codebases/dialogs/ManageCodebase/components/fields";
import { CodemieIntegration } from "@/modules/platform/codebases/dialogs/ManageCodebase/components/fields/CodemieIntegration";
import { useTypedFormContext } from "@/modules/platform/codebases/dialogs/ManageCodebase/hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "@/modules/platform/codebases/dialogs/ManageCodebase/names";
import { codebaseType } from "@my-project/shared";

export const Advanced = () => {
  const { watch } = useTypedFormContext();

  const hasJiraServerIntegrationFieldValue = watch(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name);

  const codebaseTypeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <DefaultBranch />
      </div>
      {codebaseTypeFieldValue === codebaseType.application && (
        <div>
          <DeploymentScript />
        </div>
      )}
      <div>
        <CodebaseVersioning />
      </div>
      <div>
        <CommitMessagePattern />
      </div>
      <div>
        <JiraServerIntegration />
      </div>
      <div>
        <CodemieIntegration />
      </div>

      {hasJiraServerIntegrationFieldValue ? (
        <>
          <div>
            <JiraServer />
          </div>
          <div>
            <TicketNamePattern />
          </div>
          <div>
            <AdvancedJiraMapping />
          </div>
        </>
      ) : null}
    </div>
  );
};
