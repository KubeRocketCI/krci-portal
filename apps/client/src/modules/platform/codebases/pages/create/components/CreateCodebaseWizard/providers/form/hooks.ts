import React from "react";
import { CreateCodebaseFormContext, type CreateCodebaseFormInstance } from "./context";

export const useCreateCodebaseForm = (): CreateCodebaseFormInstance => {
  const form = React.useContext(CreateCodebaseFormContext);
  if (!form) {
    throw new Error("useCreateCodebaseForm must be used within CreateCodebaseFormProvider");
  }
  return form;
};
