import { useContext } from "react";
import { EditSonarFormContext, EditSonarFormInstance } from "./context";

export const useEditSonarForm = (): EditSonarFormInstance => {
  const context = useContext(EditSonarFormContext);

  if (!context) {
    throw new Error("useEditSonarForm must be used within EditSonarFormProvider");
  }

  return context;
};
