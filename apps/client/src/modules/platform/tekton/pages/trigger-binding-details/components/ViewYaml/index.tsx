import CodeEditor from "@/core/components/CodeEditor";
import { useTriggerBindingWatch } from "../../hooks/data";

export const ViewYaml = () => {
  const watch = useTriggerBindingWatch();
  const tb = watch.query.data;
  if (!tb) return null;
  return <CodeEditor language="yaml" content={tb} />;
};
