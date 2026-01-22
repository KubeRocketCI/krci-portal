import React from "react";
import { useCreateCDPipelineFormContext } from "../../providers/form/hooks";
import { CREATE_CDPIPELINE_FORM_NAMES } from "../../types";

/**
 * Hidden form fields that register with TanStack Form for validation.
 * These fields don't render any UI - they just connect your custom
 * Applications component to TanStack Form's validation system.
 */
export const HiddenFormFields: React.FC = () => {
  const form = useCreateCDPipelineFormContext();

  return (
    <>
      {/* Register applications field for validation */}
      <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.applications.name}>{() => null}</form.AppField>

      {/* Register ui_applicationsToAddChooser field */}
      <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsToAddChooser.name}>{() => null}</form.AppField>

      {/* Register ui_applicationsFieldArray field */}
      <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name}>{() => null}</form.AppField>

      {/* Register inputDockerStreams field for validation */}
      <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.inputDockerStreams.name}>{() => null}</form.AppField>
    </>
  );
};
