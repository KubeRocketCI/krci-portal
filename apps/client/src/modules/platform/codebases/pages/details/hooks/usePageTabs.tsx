import React from "react";
import { BranchList } from "../components/BranchList";
import { Overview } from "../components/Overview";

export const usePageTabs = () => {
  return React.useMemo(() => {
    return [
      {
        label: "Overview",
        id: "overview",
        component: (
          <div className="mt-6">
            <Overview />
          </div>
        ),
      },
      {
        label: "Branches",
        id: "branches",
        component: (
          <div className="mt-6">
            <BranchList />
          </div>
        ),
      },
    ];
  }, []);
};
