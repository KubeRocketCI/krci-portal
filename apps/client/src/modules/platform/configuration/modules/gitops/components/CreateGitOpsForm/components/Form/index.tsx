import { CODEBASE_FORM_NAMES } from "../../constants";
import { CiTool, GitUrlPath, GitServer, Owner, RepositoryName } from "../fields";
import { FolderPlus, CloudDownload } from "lucide-react";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { gitProvider } from "@my-project/shared";
import { useCreateGitOpsForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import type { FormRadioOption } from "@/core/components/form";
import { cn } from "@/core/utils/classname";

const codebaseCreationStrategies: FormRadioOption[] = [
  {
    value: "create",
    label: "Create",
    description: "Create a new base repository.",
    icon: FolderPlus,
  },
  {
    value: "import",
    label: "Import",
    description: "Onboard your existing repository.",
    icon: CloudDownload,
  },
];

export const Form = () => {
  const form = useCreateGitOpsForm();

  const gitServerFieldValue = useStore(form.store, (state) => state.values[CODEBASE_FORM_NAMES.GIT_SERVER]);

  const gitServerWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });

  const gitServerProvider = gitServerWatch.query.data?.spec.gitProvider;
  const isGerrit = gitServerProvider === gitProvider.gerrit;

  return (
    <div className="flex flex-col gap-2">
      <form.AppField name={CODEBASE_FORM_NAMES.STRATEGY}>
        {(field) => (
          <field.FormRadioGroup
            options={codebaseCreationStrategies}
            variant="tile"
            classNames={{ item: "p-3", itemIcon: "h-4 w-4", itemIconContainer: "h-8 w-8" }}
          />
        )}
      </form.AppField>

      <div className="flex flex-col gap-4 p-6 px-2">
        {/* Row 1: URL-forming fields — owner + repoName = gitUrlPath for non-Gerrit; gitUrlPath direct for Gerrit */}
        <div className={cn("grid gap-4", gitServerWatch.isReady && !isGerrit ? "grid-cols-3" : "grid-cols-2")}>
          <GitServer />
          {gitServerWatch.isReady && !isGerrit && <Owner />}
          {gitServerWatch.isReady && !isGerrit && <RepositoryName />}
          {gitServerWatch.isReady && isGerrit && <GitUrlPath />}
        </div>

        {/* Row 2: CI Tool — same column width as Git Server in row 1 */}
        <div className={cn("grid gap-4", gitServerWatch.isReady && !isGerrit ? "grid-cols-3" : "grid-cols-2")}>
          <CiTool />
        </div>
      </div>
    </div>
  );
};
