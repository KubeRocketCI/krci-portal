import React from "react";
import { CreateCDPipelineFormContext } from "./context";

export const useCreateCDPipelineFormContext = () => {
  const context = React.useContext(CreateCDPipelineFormContext);

  if (!context) {
    throw new Error("useCreateCDPipelineFormContext must be used within CreateCDPipelineFormProvider");
  }

  return context;
};
