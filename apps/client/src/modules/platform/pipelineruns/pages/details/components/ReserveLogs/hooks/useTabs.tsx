import React from "react";
import { AllLogs } from "../components/AllLogs";
import { LogsByTask } from "../components/LogsByTask";

export const useTabs = () => {
  return React.useMemo(() => {
    return [
      {
        label: "All Logs",
        component: (
          <div className="pt-6">
            <AllLogs />
          </div>
        ),
      },
      {
        label: "Logs By Task",
        component: (
          <div className="pt-6">
            <LogsByTask />
          </div>
        ),
      },
    ];
  }, []);
};
