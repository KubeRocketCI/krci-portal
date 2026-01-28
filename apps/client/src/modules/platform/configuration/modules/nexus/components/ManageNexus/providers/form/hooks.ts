import { useContext } from "react";
import { ManageNexusFormContext } from "./context";

export const useManageNexusForm = () => {
  const context = useContext(ManageNexusFormContext);
  if (!context) {
    throw new Error("useManageNexusForm must be used within ManageNexusFormProvider");
  }
  return context;
};
