import { codebaseBranchStatus, codebaseVersioning, krciCommonLabels } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../../names";
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
} from "../../../fields";

export const Form = () => {
  const {
    props: { codebase, defaultBranch },
  } = useCurrentDialog();

  const { watch } = useTypedFormContext();

  const defaultBranchVersion = defaultBranch?.spec.version;

  const canCreateReleaseBranch = React.useMemo(
    () =>
      (codebase.spec.versioning.type === codebaseVersioning.edp ||
        codebase.spec.versioning.type === codebaseVersioning.semver) &&
      defaultBranch?.status?.status === codebaseBranchStatus.created,
    [codebase.spec.versioning.type, defaultBranch]
  );

  const releaseFieldValue = watch(CODEBASE_BRANCH_FORM_NAMES.release.name);

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
      </div>
    </>
  );
};
