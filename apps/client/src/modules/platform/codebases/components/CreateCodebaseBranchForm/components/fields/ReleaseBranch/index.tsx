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
import { useStore } from "@tanstack/react-form";

const createReleaseName = (versionFieldValue: string) => {
  if (!versionFieldValue) {
    return "";
  }
  const { version } = getVersionAndPostfixFromVersioningString(versionFieldValue);
  const { major, minor } = getMajorMinorPatchOfVersion(version);

  return createReleaseNameString(major, minor);
};

export const ReleaseBranch = ({ isDefaultBranchProtected, defaultBranchVersion }: ReleaseBranchProps) => {
  const form = useCreateCodebaseBranchForm();
  const releaseValue = useStore(form.store, (state) => state.values.release);

  const handleReleaseValueChange = React.useCallback(
    (checked: boolean) => {
      const values = form.store.state.values;
      const { version, releaseBranchVersionStart, defaultBranchVersionPostfix } = values;

      form.setFieldValue("release", checked);

      if (!version || !defaultBranchVersion || isDefaultBranchProtected) {
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
    [defaultBranchVersion, form, isDefaultBranchProtected]
  );

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="release-branch" className="text-sm font-medium">
          Release branch
        </Label>
      </div>
      <Switch
        id="release-branch"
        checked={releaseValue || false}
        onCheckedChange={handleReleaseValueChange}
        disabled={isDefaultBranchProtected}
      />
    </div>
  );
};
