import type { AppRouter } from "@my-project/trpc";
import { TRPCClientError } from "@trpc/client";

export type ValueOf<T> = T[keyof T];

export interface ListItemAction {
  name: string;
  label: string;
  disabled?: {
    status: boolean;
    reason?: string;
  };
  action: (e: React.SyntheticEvent) => void;
  Icon?: React.ReactNode;
  isTextButton?: boolean;
  link?: {
    to: string;
    params?: Record<string, string>;
  };
}

export type RequestError = TRPCClientError<AppRouter>;
