import { createContext } from "react";
import type { ManageJiraServerFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageJiraServerFormContext = createContext<FormApi<ManageJiraServerFormValues, undefined> | null>(null);
