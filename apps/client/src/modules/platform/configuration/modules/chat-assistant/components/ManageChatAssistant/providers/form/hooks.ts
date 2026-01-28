import { useContext } from "react";
import { ManageChatAssistantFormContext } from "./context";

export const useManageChatAssistantForm = () => {
  const context = useContext(ManageChatAssistantFormContext);
  if (!context) {
    throw new Error("useManageChatAssistantForm must be used within ManageChatAssistantFormProvider");
  }
  return context;
};
