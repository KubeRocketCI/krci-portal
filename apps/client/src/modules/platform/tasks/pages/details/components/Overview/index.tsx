import { InfoColumns } from "@/core/components/InfoColumns";
import { useInfoRows } from "./hooks/useInfoRows";
import { useTaskWatch } from "../../hooks/data";
import { BorderedSection } from "@/core/components/BorderedSection";

export const Overview = () => {
  const taskWatch = useTaskWatch();
  const task = taskWatch.query.data;

  const infoRows = useInfoRows(task!);

  return (
    <BorderedSection>
      <div>
        <InfoColumns infoRows={infoRows} />
      </div>
    </BorderedSection>
  );
};
