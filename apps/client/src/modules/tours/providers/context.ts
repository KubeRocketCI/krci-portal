import { createContext } from "react";
import type { ToursContextValue } from "./types";

export const ToursContext = createContext<ToursContextValue | null>(null);
