import React from "react";

export const TabsContext = React.createContext({
  activeTab: 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleChangeTab: (_event: React.ChangeEvent<object> | null, _newActiveTabIdx: number) => {
    //
  },
});
