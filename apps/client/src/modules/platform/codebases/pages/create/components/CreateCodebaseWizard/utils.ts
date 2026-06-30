import { gitProvider } from "@my-project/shared";

/** Whether the given Git provider value represents a Gerrit server. */
export const isGerritProvider = (provider: string | null | undefined): boolean => provider === gitProvider.gerrit;
