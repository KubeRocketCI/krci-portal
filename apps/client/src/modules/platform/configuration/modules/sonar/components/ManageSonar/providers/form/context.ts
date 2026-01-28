import { createContext } from "react";
import type { ManageSonarFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageSonarFormContext = createContext<FormApi<ManageSonarFormValues, undefined> | null>(null);
