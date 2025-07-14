import { Application, ApplicationSyncStatus } from "../../types";

export const getApplicationSyncStatus = (
  application: Application
): {
  status: ApplicationSyncStatus;
} => {
  const status = application?.status?.sync?.status?.toLowerCase() || "Unknown";

  return {
    status,
  };
};
