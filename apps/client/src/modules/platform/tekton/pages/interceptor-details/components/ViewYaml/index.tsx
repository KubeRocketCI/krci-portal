import CodeEditor from "@/core/components/CodeEditor";
import { useInterceptorWatch } from "../../hooks/data";

export const ViewYaml = () => {
  const watch = useInterceptorWatch();
  const it = watch.query.data;
  if (!it) return null;
  return <CodeEditor language="yaml" content={it} />;
};
