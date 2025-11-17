import React from "react";
import { WatchListRegistry, WatchItemRegistry } from "./registry";

export interface WatchRegistriesContextValue {
  watchListRegistry: WatchListRegistry | null;
  watchItemRegistry: WatchItemRegistry | null;
}

export const WatchRegistriesContext = React.createContext<WatchRegistriesContextValue>({
  watchListRegistry: null,
  watchItemRegistry: null,
});
