import React from "react";
import { FormContextProviderValue } from "./types";

export const FormContext = React.createContext<FormContextProviderValue<unknown>>({
  formData: {},
});
