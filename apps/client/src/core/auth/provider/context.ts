import { OIDCUser } from "@my-project/shared";
import { UseMutationResult } from "@tanstack/react-query";
import type { AppRouter, inferProcedureInput, inferProcedureOutput } from "@my-project/server";
import React from "react";

export type AuthLoginInput = inferProcedureInput<AppRouter["auth"]["login"]>;
export type AuthLoginOutput = inferProcedureOutput<AppRouter["auth"]["login"]>;

export type AuthCallbackLoginInput = inferProcedureInput<AppRouter["auth"]["loginCallback"]>;
export type AuthCallbackLoginOutput = inferProcedureOutput<AppRouter["auth"]["loginCallback"]>;

export type AuthLogoutOutput = inferProcedureOutput<AppRouter["auth"]["logout"]>;

export interface LoginMutationInput {
  redirectSearchParam: string | undefined;
}

export interface AuthContextValue {
  loginMutation: UseMutationResult<AuthLoginOutput, Error, LoginMutationInput> | null;
  loginCallbackMutation: UseMutationResult<AuthCallbackLoginOutput, Error, AuthCallbackLoginInput> | null;
  logoutMutation: UseMutationResult<AuthLogoutOutput, Error, void> | null;
  user: OIDCUser | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInProgress: boolean;
}

export const AuthContext = React.createContext<AuthContextValue>({
  loginMutation: null,
  loginCallbackMutation: null,
  logoutMutation: null,
  user: undefined,
  isLoading: false,
  isAuthenticated: false,
  authInProgress: false,
});
