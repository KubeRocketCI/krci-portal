import CodeEditor from "@/core/components/CodeEditor";
import { useClusterInterceptorWatch } from "../../hooks/data";

export const ViewYaml = () => {
  const watch = useClusterInterceptorWatch();
  const ci = watch.query.data;
  if (!ci) return null;
  return <CodeEditor language="yaml" content={ci} />;
};
