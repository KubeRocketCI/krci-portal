import { CODEBASE_FORM_NAMES } from "../../names";
import { CiTool, GitRepoPath, GitServer, Name } from "../fields";
import { FolderPlus, CloudDownload } from "lucide-react";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { gitProvider } from "@my-project/shared";
import { useGitOpsForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import type { FormRadioOption } from "@/core/form-temp";

const codebaseCreationStrategies: FormRadioOption[] = [
  {
    value: "create",
    label: "Create",
    description: "Create a new base repository.",
    icon: <FolderPlus size={24} color="#002446" />,
    checkedIcon: <FolderPlus size={24} color="#002446" />,
  },
  {
    value: "import",
    label: "Import",
    description: "Onboard your existing repository.",
    icon: <CloudDownload size={24} color="#002446" />,
    checkedIcon: <CloudDownload size={24} color="#002446" />,
  },
];

export const Create = () => {
  const form = useGitOpsForm();

  // Subscribe to gitServer field value (replaces watch)
  const gitServerFieldValue = useStore(form.store, (state) => state.values[CODEBASE_FORM_NAMES.GIT_SERVER]);

  const gitServerWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });

  const gitServer = gitServerWatch.query.data;
  const gitServerProvider = gitServer?.spec.gitProvider;

  return (
    <div className="flex flex-col gap-2">
      <form.AppField name={CODEBASE_FORM_NAMES.STRATEGY}>
        {(field) => <field.FormRadioGroup options={codebaseCreationStrategies} variant="tile" />}
      </form.AppField>

      <div className="p-6 px-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <GitServer />
          </div>
          <div>
            <CiTool />
          </div>
          {gitServerProvider !== gitProvider.gerrit && !!gitServerWatch.isReady && (
            <div className="col-span-2">
              <GitRepoPath />
            </div>
          )}
          <div>
            <Name />
          </div>
        </div>
      </div>
    </div>
  );
};
