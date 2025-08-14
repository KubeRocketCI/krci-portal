import { Box } from "@mui/material";
import React from "react";
import { AllLogs } from "../components/AllLogs";
import { LogsByTask } from "../components/LogsByTask";

export const useTabs = () => {
  return React.useMemo(() => {
    return [
      {
        label: "All Logs",
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <AllLogs />
          </Box>
        ),
      },
      {
        label: "Logs By Task",
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <LogsByTask />
          </Box>
        ),
      },
    ];
  }, []);
};
