import React from "react";
import { DataContext } from "./context";
import { DataContextProviderProps } from "./types";

export const DataContextProvider: React.FC<DataContextProviderProps> = ({
  children,
  gitServer,
  gitServerSecret,
  handleClosePanel,
}) => {
  return (
    <DataContext.Provider
      value={{
        gitServer,
        gitServerSecret,
        handleClosePanel,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
