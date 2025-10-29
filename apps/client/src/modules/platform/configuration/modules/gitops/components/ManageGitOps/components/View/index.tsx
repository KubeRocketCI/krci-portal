import { useFormContext } from "react-hook-form";
import { CODEBASE_FORM_NAMES } from "../../names";
import { ManageGitOpsValues } from "../../types";
import { GitRepoPath, GitServer, Name } from "../fields";
import { gitProvider } from "@my-project/shared";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";

export const View = () => {
  const { watch } = useFormContext<ManageGitOpsValues>();

  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.GIT_SERVER);

  const gitServerWatch = useGitServerWatchItem({
    name: gitServerFieldValue,
  });

  const gitServer = gitServerWatch.query.data;

  const gitServerProvider = gitServer?.spec.gitProvider;

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <GitServer />
        </div>
        {gitServerProvider !== gitProvider.gerrit && !!gitServerWatch.isReady && (
          <div className="col-span-5">
            <GitRepoPath />
          </div>
        )}
        <div className="col-span-3">
          <Name />
        </div>
      </div>
    </>
  );
};
