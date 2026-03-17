import React from "react";
import { EditGitServerFormContext, type EditGitServerFormInstance } from "./context";

export const useEditGitServerForm = (): EditGitServerFormInstance => {
  const context = React.useContext(EditGitServerFormContext);
  if (!context) {
    throw new Error("useEditGitServerForm must be used within EditGitServerFormProvider");
  }
  return context;
};
