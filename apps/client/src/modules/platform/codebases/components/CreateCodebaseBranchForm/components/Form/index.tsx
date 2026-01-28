import { codebaseBranchStatus, codebaseVersioning, krciCommonLabels } from "@my-project/shared";
import type { Codebase, CodebaseBranch } from "@my-project/shared";
import React from "react";
import { useCreateCodebaseBranchForm } from "../../providers/form/hooks";
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
} from "../fields";
import { useStore } from "@tanstack/react-form";

interface FormProps {
  codebase: Codebase;
  defaultBranch: CodebaseBranch;
  pipelines: {
    review?: string;
    build?: string;
    security?: string;
  };
}

export const Form = ({ codebase, defaultBranch, pipelines }: FormProps) => {
  const form = useCreateCodebaseBranchForm();

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
            <BranchName codebase={codebase} defaultBranchVersion={defaultBranchVersion!} />
          </div>
        )}
        <div>
          <FromCommit codebase={codebase} defaultBranch={defaultBranch} />
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
          <ReviewPipeline defaultPipeline={pipelines.review} />
        </div>
        <div>
          <BuildPipeline defaultPipeline={pipelines.build} />
        </div>
        <div>
          <SecurityPipeline defaultPipeline={pipelines.security} />
        </div>
      </div>
    </>
  );
};
