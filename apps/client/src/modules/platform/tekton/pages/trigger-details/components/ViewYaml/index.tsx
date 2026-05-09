import CodeEditor from "@/core/components/CodeEditor";
import { useTriggerWatch } from "../../hooks/data";

export const ViewYaml = () => {
  const watch = useTriggerWatch();
  const trigger = watch.query.data;
  if (!trigger) return null;
  return <CodeEditor language="yaml" content={trigger} />;
};
