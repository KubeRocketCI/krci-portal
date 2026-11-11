import { useClusterStore } from "@/k8s/store";

/** DefectDojo base URL from the server config; an empty string means DefectDojo is not configured. */
export const useDefectDojoWebUrl = (): string => useClusterStore((state) => state.defectDojoWebUrl);
