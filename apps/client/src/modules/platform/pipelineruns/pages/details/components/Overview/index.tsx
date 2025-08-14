import { useInfoRows } from "./hooks/useInfoRows";
import { BorderedSection } from "@/core/components/BorderedSection";
import { InfoColumns } from "@/core/components/InfoColumns";

export const Overview = () => {
  const infoRows = useInfoRows();

  return (
    <BorderedSection>
      <div>
        <InfoColumns infoRows={infoRows} />
      </div>
    </BorderedSection>
  );
};
