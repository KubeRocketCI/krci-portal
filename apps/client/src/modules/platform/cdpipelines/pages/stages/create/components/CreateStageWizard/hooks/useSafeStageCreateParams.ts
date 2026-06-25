import { useParams } from "@tanstack/react-router";

// `strict: false` returns the active route's params without throwing when the wizard renders
// outside its route (e.g. Storybook); the `= ""` defaults then cover that param-less case.
export const useSafeStageCreateParams = (): { namespace: string; cdPipeline: string } => {
  const { namespace = "", cdPipeline = "" } = useParams({ strict: false }) as {
    namespace?: string;
    cdPipeline?: string;
  };

  return { namespace, cdPipeline };
};
