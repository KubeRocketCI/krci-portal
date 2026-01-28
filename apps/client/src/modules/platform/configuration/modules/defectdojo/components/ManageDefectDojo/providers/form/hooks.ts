import { useContext } from "react";
import { ManageDefectDojoFormContext } from "./context";

export const useManageDefectDojoForm = () => {
  const context = useContext(ManageDefectDojoFormContext);
  if (!context) {
    throw new Error("useManageDefectDojoForm must be used within ManageDefectDojoFormProvider");
  }
  return context;
};
