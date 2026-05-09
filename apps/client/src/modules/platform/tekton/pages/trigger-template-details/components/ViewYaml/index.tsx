import CodeEditor from "@/core/components/CodeEditor";
import { useTriggerTemplateWatch } from "../../hooks/data";

export const ViewYaml = () => {
  const watch = useTriggerTemplateWatch();
  const tt = watch.query.data;
  if (!tt) return null;
  return <CodeEditor language="yaml" content={tt} />;
};
