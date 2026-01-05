import CodeEditor from "@/core/components/CodeEditor";
import { useTaskWatch } from "../../hooks/data";

export const ViewTask = () => {
  const taskWatch = useTaskWatch();
  const task = taskWatch.query.data;

  return <CodeEditor language="yaml" content={task!} />;
};
