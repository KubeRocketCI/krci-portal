import { ManageChatAssistantProps } from "../../types";

export type DataContextProviderValue = ManageChatAssistantProps;

export type DataContextProviderProps = ManageChatAssistantProps & {
  children: React.ReactNode;
};
