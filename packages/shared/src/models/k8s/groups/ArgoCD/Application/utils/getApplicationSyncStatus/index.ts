import { Application, ApplicationHealthStatus } from "../../types";

export const getApplicationStatus = (
  application: Application
): {
  status: ApplicationHealthStatus;
} => {
  const status =
    application?.status?.health?.status?.toLowerCase() || "Unknown";

  return {
    status,
  };
};
