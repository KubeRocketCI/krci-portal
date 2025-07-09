import React from "react";
import { WidgetConfig } from "../../dialogs/AddNewWidget/types";

export const UserWidgetsContext = React.createContext<
  { userWidgets: WidgetConfig[]; setUserWidgets: (widgets: WidgetConfig[]) => void } | undefined
>(undefined);
