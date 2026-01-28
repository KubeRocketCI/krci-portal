import { createContext } from "react";
import type { ManageNexusFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageNexusFormContext = createContext<FormApi<ManageNexusFormValues, undefined> | null>(null);
