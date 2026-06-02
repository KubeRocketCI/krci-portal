import React from "react";
import { RELEASE_BRANCH_POSTFIX } from "../../../constants";
import { useCreateCodebaseBranchForm } from "../../../providers/form/hooks";
import { ReleaseBranchProps } from "./types";
import {
  getVersionAndPostfixFromVersioningString,
  getMajorMinorPatchOfVersion,
  createReleaseNameString,
  createVersioningString,
} from "@my-project/shared";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";
import { useStore } from "@tanstack/react-form";

const createReleaseName = (versionFieldValue: string) => {
  if (!versionFieldValue) {
    return "";
  }
  const { version } = getVersionAndPostfixFromVersioningString(versionFieldValue);
  const { major, minor } = getMajorMinorPatchOfVersion(version);

  return createReleaseNameString(major, minor);
};

export const ReleaseBranch = ({ disabledReason, defaultBranchVersion, defaultBranchName }: ReleaseBranchProps) => {
  const form = useCreateCodebaseBranchForm();
  const releaseValue = useStore(form.store, (state) => state.values.release);

  const isDisabled = !!disabledReason;

  const handleReleaseValueChange = React.useCallback(
    (checked: boolean) => {
      const values = form.store.state.values;
      const { version, releaseBranchVersionStart, defaultBranchVersionPostfix } = values;

      form.setFieldValue("release", checked);

      // A release branch must always be cut from the default branch. Reset the source
      // here so a commit/branch selected before enabling the switch can't redefine it.
      if (checked) {
        form.setFieldValue("fromType", "branch" as const);
        form.setFieldValue("fromCommit", defaultBranchName);
      }

      if (!version || !defaultBranchVersion || isDisabled) {
        return;
      }

      const { postfix } = getVersionAndPostfixFromVersioningString(defaultBranchVersion);
      const newReleaseName = createReleaseName(version);
      const newReleaseBranchName = checked ? newReleaseName : "";
      const branchVersionPostfix = checked ? RELEASE_BRANCH_POSTFIX : postfix;
      const newVersion = checked
        ? createVersioningString(releaseBranchVersionStart, RELEASE_BRANCH_POSTFIX)
        : createVersioningString(releaseBranchVersionStart, postfix);

      const [currentBranchVersion] = newVersion.split("-");
      const { major, minor, patch } = getMajorMinorPatchOfVersion(currentBranchVersion);
      const newDefaultBranchMinor = minor + 1;
      const defaultBranchNewVersion = [major, newDefaultBranchMinor, patch].join(".");

      form.setFieldValue("releaseBranchName", newReleaseBranchName);
      form.setFieldValue("releaseBranchVersionPostfix", branchVersionPostfix);
      form.setFieldValue("version", newVersion);
      form.setFieldValue("defaultBranchVersionStart", defaultBranchNewVersion);

      if (!defaultBranchVersionPostfix) {
        form.setFieldValue("defaultBranchVersionPostfix", postfix);
      }
    },
    [defaultBranchVersion, defaultBranchName, form, isDisabled]
  );

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-1.5">
        <Label htmlFor="release-branch" className="text-sm font-medium">
          Release branch
        </Label>
        {disabledReason && (
          <Tooltip title={disabledReason}>
            <Info size={16} className="text-muted-foreground" />
          </Tooltip>
        )}
      </div>
      <Switch
        id="release-branch"
        checked={releaseValue || false}
        onCheckedChange={handleReleaseValueChange}
        disabled={isDisabled}
      />
    </div>
  );
};
