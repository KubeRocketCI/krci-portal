import React from "react";
import { CreateGitServerFormContext, type CreateGitServerFormInstance } from "./context";

export const useCreateGitServerForm = (): CreateGitServerFormInstance => {
  const context = React.useContext(CreateGitServerFormContext);
  if (!context) {
    throw new Error("useCreateGitServerForm must be used within CreateGitServerFormProvider");
  }
  return context;
};
