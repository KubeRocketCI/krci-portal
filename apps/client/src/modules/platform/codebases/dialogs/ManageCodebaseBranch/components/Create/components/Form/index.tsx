import { codebaseBranchStatus, codebaseVersioning, krciCommonLabels } from "@my-project/shared";
import React from "react";
import { useCodebaseBranchForm } from "../../../../providers/form/hooks";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import {
  BranchName,
  BranchVersion,
  BuildPipeline,
  DefaultBranchVersion,
  FromCommit,
  ReleaseBranch,
  ReleaseBranchName,
  ReviewPipeline,
  SecurityPipeline,
} from "../../../fields";
import { useStore } from "@tanstack/react-form";

export const Form = () => {
  const {
    props: { codebase, defaultBranch },
  } = useCurrentDialog();

  const form = useCodebaseBranchForm();

  const defaultBranchVersion = defaultBranch?.spec.version;

  const canCreateReleaseBranch = React.useMemo(
    () =>
      (codebase.spec.versioning.type === codebaseVersioning.edp ||
        codebase.spec.versioning.type === codebaseVersioning.semver) &&
      defaultBranch?.status?.status === codebaseBranchStatus.created,
    [codebase.spec.versioning.type, defaultBranch]
  );

  const releaseFieldValue = useStore(form.store, (state) => state.values.release);

  const isDefaultBranchProtected = React.useMemo(() => {
    return !!defaultBranch?.metadata?.labels?.[krciCommonLabels.editProtection];
  }, [defaultBranch]);

  return (
    <>
      <div className="flex flex-col gap-4">
        {canCreateReleaseBranch && (
          <div>
            <ReleaseBranch
              isDefaultBranchProtected={isDefaultBranchProtected}
              defaultBranchVersion={defaultBranchVersion!}
            />
          </div>
        )}
        {releaseFieldValue ? (
          <div>
            <ReleaseBranchName defaultBranchVersion={defaultBranchVersion!} />
          </div>
        ) : (
          <div>
            <BranchName defaultBranchVersion={defaultBranchVersion!} />
          </div>
        )}
        <div>
          <FromCommit />
        </div>
        {canCreateReleaseBranch && (
          <>
            <div>
              <BranchVersion />
            </div>
            {!!releaseFieldValue && (
              <div>
                <DefaultBranchVersion />
              </div>
            )}
          </>
        )}
        <div>
          <ReviewPipeline />
        </div>
        <div>
          <BuildPipeline />
        </div>
        <div>
          <SecurityPipeline />
        </div>
      </div>
    </>
  );
};
