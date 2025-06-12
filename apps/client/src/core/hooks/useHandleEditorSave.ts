import { KubeObjectBase } from "@my-project/shared";
import { has } from "lodash";
import React from "react";
import { FieldValues, Path, PathValue, UseFormResetField, UseFormSetValue } from "react-hook-form";
import { FormNameObject, BackwardNameMapping, BackwardNameMappingChildren } from "../types/forms";

interface useHandleEditorSaveProps<FormValues extends Record<string, unknown>> {
  names: Record<string, FormNameObject>;
  backwardNames?: BackwardNameMapping;
  setValue: UseFormSetValue<FormValues>;
  resetField: UseFormResetField<FormValues>;
}

export type KRCIResourceBase = KubeObjectBase & {
  spec: Record<string, unknown>;
};

export const useHandleEditorSave = <FormValues extends Record<string, unknown>>({
  names,
  backwardNames = {},
  setValue,
  resetField,
}: useHandleEditorSaveProps<FormValues>) => {
  const cleanFormStateFromUnusedProps = React.useCallback(
    (editorPropsObject: KubeObjectBase, formValues: FieldValues) => {
      for (const formValueKey of Object.keys(formValues)) {
        const propNameObjectPath = names[formValueKey].path;

        if (propNameObjectPath && has(editorPropsObject, propNameObjectPath)) {
          continue;
        }

        resetField(names[formValueKey].name as unknown as Path<FormValues>);
      }
    },
    [names, resetField]
  );

  const recursiveSetFieldValueBasedOnBackwardsMappingName = React.useCallback(
    (children: BackwardNameMappingChildren, value: unknown): void => {
      if (children.formItemName) {
        setValue(
          names[children.formItemName].name as unknown as Path<FormValues>,
          value as unknown as PathValue<FormValues, Path<FormValues>>
        );
      }

      if (children.children) {
        for (const [childKey, childValue] of Object.entries(children.children)) {
          recursiveSetFieldValueBasedOnBackwardsMappingName(childValue, (value as Record<string, unknown>)[childKey]);
        }
      }
    },
    [names, setValue]
  );

  const handleEditorSave = React.useCallback(
    (editorResultValue: KRCIResourceBase, formValues: FieldValues) => {
      /*
			This is the example of values we get on editorSave

				{
					"apiVersion": "v2.edp.epam.com/v1",
					"kind": "Codebase",
					"spec": {
						"type": "application",
						"versioning": {
							"type": "default"
						},
					},
					"metadata": {
						"name": "app-test",
						"namespace": "edp-delivery-vp-delivery-dev"
					}
				}

			The value objects like versioning have to be mapped to form names in order to setValues in form state and so on
			for example value object versioning: {type: 'default'} have to be mapped to versioningType form name value


			 */

      // we need to process only spec and metadata since createInstance function already has apiVersion and kind in its config
      const { spec, metadata } = editorResultValue;
      const specAndMetadata = { ...spec, ...metadata };

      // we don't have to handle any other values except spec and metadata for now
      for (const [editorRootPropKey, editorRootPropValue] of Object.entries(specAndMetadata)) {
        if (Object.hasOwn(backwardNames, editorRootPropKey)) {
          const backwardNamesObject = backwardNames[editorRootPropKey];

          recursiveSetFieldValueBasedOnBackwardsMappingName(backwardNamesObject, editorRootPropValue);
        } else {
          // for simple flat values or arrays
          setValue(
            names[editorRootPropKey].name as unknown as Path<FormValues>,
            editorRootPropValue as unknown as PathValue<FormValues, Path<FormValues>>
          );
        }
      }
      /*
				Deletion process

				When comparing formValues from state and the values we get on editorSave
				we check if formValue still exists in those values and if not we delete it from form state

			*/
      cleanFormStateFromUnusedProps(editorResultValue, formValues);
    },
    [backwardNames, cleanFormStateFromUnusedProps, names, recursiveSetFieldValueBasedOnBackwardsMappingName, setValue]
  );

  return { handleEditorSave };
};
