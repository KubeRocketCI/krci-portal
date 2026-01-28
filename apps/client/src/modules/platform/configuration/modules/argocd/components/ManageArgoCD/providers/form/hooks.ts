import { useContext } from "react";
import { ManageArgoCDFormContext } from "./context";

export const useManageArgoCDForm = () => {
  const context = useContext(ManageArgoCDFormContext);
  if (!context) {
    throw new Error("useManageArgoCDForm must be used within ManageArgoCDFormProvider");
  }
  return context;
};
