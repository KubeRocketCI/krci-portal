import { useContext } from "react";
import { WatchRegistriesContext, WatchRegistriesContextValue } from "./context";

/**
 * Hook to access watch registries from context.
 * Returns null registries when user is not authenticated.
 */
export const useWatchRegistries = (): WatchRegistriesContextValue => {
  return useContext(WatchRegistriesContext);
};
