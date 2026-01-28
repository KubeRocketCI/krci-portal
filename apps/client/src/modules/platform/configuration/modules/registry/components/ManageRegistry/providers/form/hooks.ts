import { useContext } from "react";
import { ManageRegistryFormContext } from "./context";

export const useManageRegistryForm = () => {
  const context = useContext(ManageRegistryFormContext);

  if (!context) {
    throw new Error("useManageRegistryForm must be used within ManageRegistryFormProvider");
  }

  return context;
};
