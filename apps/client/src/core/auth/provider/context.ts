import {
  OIDCUser,
  LoginOutput,
  LoginCallbackInput,
  LoginCallbackOutput,
  LoginWithTokenOutput,
  LogoutnOutput,
} from "@my-project/shared";
import { UseMutationResult } from "@tanstack/react-query";
import React from "react";

export type AuthLoginOutput = LoginOutput;
export type AuthCallbackLoginInput = LoginCallbackInput;
export type AuthCallbackLoginOutput = LoginCallbackOutput;
export type AuthLoginWithTokenOutput = LoginWithTokenOutput;
export type AuthLogoutOutput = LogoutnOutput;

export interface LoginMutationInput {
  redirectSearchParam: string | undefined;
}

export interface LoginWithTokenMutationInput {
  token: string;
  redirectSearchParam?: string;
}

export interface AuthContextValue {
  loginMutation: UseMutationResult<AuthLoginOutput, Error, LoginMutationInput> | null;
  loginCallbackMutation: UseMutationResult<AuthCallbackLoginOutput, Error, AuthCallbackLoginInput> | null;
  loginWithTokenMutation: UseMutationResult<AuthLoginWithTokenOutput, Error, LoginWithTokenMutationInput> | null;
  logoutMutation: UseMutationResult<AuthLogoutOutput, Error, void> | null;
  user: OIDCUser | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInProgress: boolean;
}

export const AuthContext = React.createContext<AuthContextValue>({
  loginMutation: null,
  loginCallbackMutation: null,
  loginWithTokenMutation: null,
  logoutMutation: null,
  user: undefined,
  isLoading: false,
  isAuthenticated: false,
  authInProgress: false,
});
