import React from "react";
import type { FormAsyncValidateOrFn, FormValidateOrFn, ReactFormExtendedApi } from "@tanstack/react-form";
import type { ApplicationsFormValues } from "../types";

// Typed form API used across the Applications feature
export type ApplicationsFormApi = ReactFormExtendedApi<
  ApplicationsFormValues, // TFormData
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnMount
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnChange
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnChangeAsync
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnBlur
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnBlurAsync
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnSubmit
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnSubmitAsync
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnDynamic
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnDynamicAsync
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnServer
  unknown // TSubmitMeta
>;

export const ApplicationsFormContext = React.createContext<ApplicationsFormApi | null>(null);

export const useApplicationsForm = (): ApplicationsFormApi => {
  const context = React.useContext(ApplicationsFormContext);
  if (!context) {
    throw new Error("useApplicationsForm must be used within ApplicationsFormContext.Provider");
  }
  return context;
};
