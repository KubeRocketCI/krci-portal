import React from "react";
import { BranchList } from "../components/BranchList";
import { Code } from "../components/Code";
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
      {
        label: "Pull Requests",
        id: "code",
        component: (
          <div className="mt-6">
            <Code />
          </div>
        ),
      },
    ];
  }, []);
};
