import { useContext } from "react";
import { ManageGitServerFormContext } from "./context";

export const useManageGitServerForm = () => {
  const context = useContext(ManageGitServerFormContext);
  if (!context) {
    throw new Error("useManageGitServerForm must be used within ManageGitServerFormProvider");
  }
  return context;
};
