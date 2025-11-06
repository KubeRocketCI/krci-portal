import { useFormContext } from "react-hook-form";
import { CODEBASE_FORM_NAMES } from "../../names";
import { ManageGitOpsValues } from "../../types";
import { CiTool, GitRepoPath, GitServer, Name } from "../fields";
import { FolderPlus, CloudDownload } from "lucide-react";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { gitProvider } from "@my-project/shared";
import { TileRadioGroup } from "@/core/providers/Form/components/MainRadioGroup";

const codebaseCreationStrategies = [
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
  const { watch } = useFormContext<ManageGitOpsValues>();
  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.GIT_SERVER);

  const gitServerWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });

  const gitServer = gitServerWatch.query.data;

  const gitServerProvider = gitServer?.spec.gitProvider;

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col gap-2">
      <TileRadioGroup
        {...register(CODEBASE_FORM_NAMES.STRATEGY)}
        control={control}
        errors={errors}
        options={codebaseCreationStrategies}
        gridCols={3}
      />

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
          <div className="w-1/4">
            <Name />
          </div>
        </div>
      </div>
    </div>
  );
};
