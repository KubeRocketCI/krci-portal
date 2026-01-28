import { createContext } from "react";
import type { ManageChatAssistantFormValues } from "../../names";
import type { FormApi } from "@tanstack/react-form";

export const ManageChatAssistantFormContext = createContext<
  FormApi<ManageChatAssistantFormValues, undefined> | null
>(null);
