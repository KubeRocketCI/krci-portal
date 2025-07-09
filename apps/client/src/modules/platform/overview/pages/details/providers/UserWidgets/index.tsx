import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import React from "react";
import { WidgetConfig } from "../../dialogs/AddNewWidget/types";
import { UserWidgetsContext } from "./context";

export const UserWidgetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userWidgets, setUserWidgetsInState] = React.useState<WidgetConfig[]>(() => {
    return LOCAL_STORAGE_SERVICE.getItem("userWidgets") || [];
  });

  React.useEffect(() => {
    LOCAL_STORAGE_SERVICE.setItem("userWidgets", userWidgets);
  }, [userWidgets]);

  const setUserWidgets = React.useCallback((widgets: WidgetConfig[]) => {
    setUserWidgetsInState(widgets);
  }, []);

  return <UserWidgetsContext.Provider value={{ userWidgets, setUserWidgets }}>{children}</UserWidgetsContext.Provider>;
};
