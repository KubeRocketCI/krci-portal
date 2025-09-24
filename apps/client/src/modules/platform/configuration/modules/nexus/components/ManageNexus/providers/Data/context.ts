import React from "react";
import { DataContextProviderValue } from "./types";
import { Secret, QuickLink } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";

export const DataContext = React.createContext<DataContextProviderValue>({
  secret: null as unknown as Secret,
  quickLink: null as unknown as QuickLink,
  mode: FORM_MODES.CREATE,
  ownerReference: null as unknown as string,
  handleClosePanel: () => {
    //
  },
});
