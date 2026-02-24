import { createContext } from "react";
import type { FormGuideContextValue } from "./types";

export const FormGuideContext = createContext<FormGuideContextValue>({
  isOpen: false,
  toggle: () => {},
  currentStep: undefined,
  fields: [],
  docUrl: undefined,
});
