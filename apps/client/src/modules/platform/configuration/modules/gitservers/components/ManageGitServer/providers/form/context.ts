import { createContext } from "react";
import type { ManageGitServerFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageGitServerFormContext =
  createContext<FormApi<ManageGitServerFormValues, undefined> | null>(null);
