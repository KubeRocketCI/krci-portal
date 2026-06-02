import { isKRCIVersioning, codebaseBranchStatus, krciCommonLabels } from "@my-project/shared";
import type { Codebase, CodebaseBranch } from "@my-project/shared";
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

  const defaultBranchVersion = defaultBranch?.spec.version ?? undefined;

  const releaseFieldValue = useStore(form.store, (state) => state.values.release);

  const isDefaultBranchProtected = !!defaultBranch?.metadata?.labels?.[krciCommonLabels.editProtection];

  const supportsReleaseVersioning = isKRCIVersioning(codebase.spec.versioning.type);

  const isDefaultBranchReady = defaultBranch?.status?.status === codebaseBranchStatus.created;

  const canCreateReleaseBranch = supportsReleaseVersioning && isDefaultBranchReady;

  let releaseBranchDisabledReason: string | undefined;
  if (!supportsReleaseVersioning) {
    releaseBranchDisabledReason = "Release branches are available only for codebases using EDP or SemVer versioning.";
  } else if (!isDefaultBranchReady) {
    releaseBranchDisabledReason =
      "Release branches can be created only after the default branch has been successfully provisioned.";
  } else if (isDefaultBranchProtected) {
    releaseBranchDisabledReason =
      "The default branch is protected from editing, so a release branch cannot be created from it.";
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <ReleaseBranch
            disabledReason={releaseBranchDisabledReason}
            defaultBranchVersion={defaultBranchVersion}
            defaultBranchName={defaultBranch?.spec.branchName ?? ""}
          />
        </div>
        {releaseFieldValue ? (
          <div>
            <ReleaseBranchName defaultBranchVersion={defaultBranchVersion} />
          </div>
        ) : (
          <div>
            <BranchName codebase={codebase} defaultBranchVersion={defaultBranchVersion} />
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
