import React from "react";
import { UserWidgetsContext } from "./context";

export const useUserWidgets = () => {
  const context = React.useContext(UserWidgetsContext);
  if (!context) {
    throw new Error("useUserWidgets must be used within a UserWidgetsProvider");
  }
  return context;
};
