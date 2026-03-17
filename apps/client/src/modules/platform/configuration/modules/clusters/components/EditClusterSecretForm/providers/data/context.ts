import React from "react";
import type { ManageClusterSecretDataContext } from "../../types";

export const ClusterSecretDataContext = React.createContext<ManageClusterSecretDataContext | null>(null);
