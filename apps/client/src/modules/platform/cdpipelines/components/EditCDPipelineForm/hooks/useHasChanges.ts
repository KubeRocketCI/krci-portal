import { useChanges } from "./useChanges";

export const useHasChanges = (): boolean => {
  const { hasAnyChanges } = useChanges();
  return hasAnyChanges;
};
