import { createContext } from "react";
import type { ManageDependencyTrackFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageDependencyTrackFormContext = createContext<
  FormApi<ManageDependencyTrackFormValues, undefined> | null
>(null);
