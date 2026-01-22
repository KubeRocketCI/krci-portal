import React from "react";
import { CreateStageFormContext, type CreateStageFormInstance } from "./context";

export const useCreateStageForm = (): CreateStageFormInstance => {
  const form = React.useContext(CreateStageFormContext);
  if (!form) {
    throw new Error("useCreateStageForm must be used within CreateStageFormProvider");
  }
  return form;
};
