import { CODEBASE_FORM_NAMES } from "../../names";
import { GitRepoPath, GitServer, Name } from "../fields";
import { gitProvider } from "@my-project/shared";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { useGitOpsForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

export const View = () => {
  const form = useGitOpsForm();

  // Subscribe to gitServer field value (replaces watch)
  const gitServerFieldValue = useStore(form.store, (state) => state.values[CODEBASE_FORM_NAMES.GIT_SERVER]);

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
