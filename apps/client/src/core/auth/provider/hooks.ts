import React from "react";
import { AuthContext } from "./context";

export const useAuth = () => React.useContext(AuthContext);
