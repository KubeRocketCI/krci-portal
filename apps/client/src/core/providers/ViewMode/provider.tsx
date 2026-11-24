import React from "react";
import { LOCAL_STORAGE_SERVICE } from "../../services/local-storage";
import { ViewModeContext } from "./context";
import { VIEW_MODES, ViewMode, ViewModeContextProviderProps, viewModeStorageKey } from "./types";

export const ViewModeContextProvider: React.FC<React.PropsWithChildren<ViewModeContextProviderProps>> = ({
  children,
  entityID,
  defaultViewMode = VIEW_MODES.GRID,
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>(
    () => (LOCAL_STORAGE_SERVICE.getItem(viewModeStorageKey(entityID)) as ViewMode) || defaultViewMode
  );

  const handleChangeViewMode = React.useCallback(
    (viewMode: ViewMode) => {
      LOCAL_STORAGE_SERVICE.setItem(viewModeStorageKey(entityID), viewMode);
      setViewMode(viewMode);
    },
    [entityID]
  );

  return (
    <ViewModeContext.Provider
      value={{
        entityID,
        viewMode,
        handleChangeViewMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};
