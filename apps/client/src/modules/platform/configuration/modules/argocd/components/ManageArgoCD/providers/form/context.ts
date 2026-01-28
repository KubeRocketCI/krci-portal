import { createContext } from "react";
import type { ManageArgoCDFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageArgoCDFormContext = createContext<FormApi<ManageArgoCDFormValues, undefined> | null>(null);
