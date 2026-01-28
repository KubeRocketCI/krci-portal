import React from "react";
import { useStore } from "@tanstack/react-form";
import z from "zod";
import { codebaseVersioning } from "@my-project/shared";
import { mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const CodebaseVersioning: React.FC = () => {
  const form = useCreateCodebaseForm();
  const versioningTypeFieldValue = useStore(form.store, (s) => s.values[NAMES.versioningType]);
  const versioningStartFromVersion = useStore(form.store, (s) => s.values[NAMES.ui_versioningStartFromVersion]);
  const versioningStartFromSnapshot = useStore(form.store, (s) => s.values[NAMES.ui_versioningStartFromSnapshot]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <form.AppField
        name={NAMES.versioningType}
        validators={{
          onChange: ({ value }) => (!value ? "Select codebase versioning type" : undefined),
        }}
        listeners={{
          onChange: ({ value }) => {
            if (
              (value === codebaseVersioning.edp || value === codebaseVersioning.semver) &&
              !versioningStartFromVersion &&
              !versioningStartFromSnapshot
            ) {
              form.setFieldValue(NAMES.ui_versioningStartFromVersion, "0.0.0");
              form.setFieldValue(NAMES.ui_versioningStartFromSnapshot, "SNAPSHOT");
              form.setFieldValue(NAMES.versioningStartFrom, "0.0.0-SNAPSHOT");
            }
          },
        }}
      >
        {(field) => (
          <field.FormSelect
            label="Codebase versioning type"
            tooltipText="Define the versioning strategy for source code and artifacts."
            options={mapObjectValuesToSelectOptions(codebaseVersioning)}
          />
        )}
      </form.AppField>

      {(versioningTypeFieldValue === codebaseVersioning.edp ||
        versioningTypeFieldValue === codebaseVersioning.semver) && (
        <>
          <form.AppField
            name={NAMES.ui_versioningStartFromVersion}
            validators={{
              onChange: z
                .string()
                .min(1, "Specify the initial version.")
                .regex(
                  /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/,
                  "Enter valid semantic versioning format"
                ),
            }}
            listeners={{
              onBlur: () => {
                const version = form.getFieldValue(NAMES.ui_versioningStartFromVersion) || "";
                const snapshot = versioningStartFromSnapshot || "";
                form.setFieldValue(NAMES.versioningStartFrom, `${version}-${snapshot}`);
              },
            }}
          >
            {(field) => (
              <field.FormTextField
                label="Start version from"
                tooltipText="Define the initial version number or identifier for your codebase to mark the starting point for version control."
                placeholder="0.0.0"
              />
            )}
          </form.AppField>
          <form.AppField
            name={NAMES.ui_versioningStartFromSnapshot}
            validators={{ onChange: z.string().min(1, "Add a suffix.") }}
            listeners={{
              onBlur: () => {
                const version = versioningStartFromVersion || "";
                const snapshot = form.getFieldValue(NAMES.ui_versioningStartFromSnapshot) || "";
                form.setFieldValue(NAMES.versioningStartFrom, `${version}-${snapshot}`);
              },
            }}
          >
            {(field) => (
              <field.FormTextField
                placeholder="SNAPSHOT"
                label="Suffix"
                tooltipText="Add a suffix to your version name to provide categorization. E.g. SNAPSHOT, unstable, test."
              />
            )}
          </form.AppField>
        </>
      )}
    </div>
  );
};
