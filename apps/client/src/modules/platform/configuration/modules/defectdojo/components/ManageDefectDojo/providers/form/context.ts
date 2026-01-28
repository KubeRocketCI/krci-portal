import { createContext } from "react";
import type { ManageDefectDojoFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageDefectDojoFormContext = createContext<FormApi<ManageDefectDojoFormValues, undefined> | null>(null);
