import {
  OIDCUser,
  LoginOutput,
  LoginCallbackInput,
  LoginCallbackOutput,
  LoginWithTokenInput,
  LoginWithTokenOutput,
  LoginWithSATokenInput,
  LoginWithSATokenOutput,
  LogoutOutput,
} from "@my-project/shared";
import { UseMutationResult } from "@tanstack/react-query";
import React from "react";

export type AuthLoginOutput = LoginOutput;
export type AuthCallbackLoginInput = LoginCallbackInput;
export type AuthCallbackLoginOutput = LoginCallbackOutput;
export type AuthLoginWithTokenOutput = LoginWithTokenOutput;
export type AuthLoginWithSATokenOutput = LoginWithSATokenOutput;
export type AuthLogoutOutput = LogoutOutput;

export interface LoginMutationInput {
  redirectSearchParam: string | undefined;
}

export type LoginWithTokenMutationInput = LoginWithTokenInput;

export type LoginWithSATokenMutationInput = LoginWithSATokenInput;

export interface AuthContextValue {
  loginMutation: UseMutationResult<AuthLoginOutput, Error, LoginMutationInput> | null;
  loginCallbackMutation: UseMutationResult<AuthCallbackLoginOutput, Error, AuthCallbackLoginInput> | null;
  loginWithTokenMutation: UseMutationResult<AuthLoginWithTokenOutput, Error, LoginWithTokenMutationInput> | null;
  loginWithServiceAccountTokenMutation: UseMutationResult<
    AuthLoginWithSATokenOutput,
    Error,
    LoginWithSATokenMutationInput
  > | null;
  logoutMutation: UseMutationResult<AuthLogoutOutput, Error, void> | null;
  user: OIDCUser | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInProgress: boolean;
  /** Whether OIDC is configured server-side. When false, only SA-token login is offered. */
  oidcEnabled: boolean;
}

export const AuthContext = React.createContext<AuthContextValue>({
  loginMutation: null,
  loginCallbackMutation: null,
  loginWithTokenMutation: null,
  loginWithServiceAccountTokenMutation: null,
  logoutMutation: null,
  user: undefined,
  isLoading: false,
  isAuthenticated: false,
  authInProgress: false,
  oidcEnabled: true,
});
