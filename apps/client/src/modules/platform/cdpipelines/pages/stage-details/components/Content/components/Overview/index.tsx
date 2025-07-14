import { BorderedSection } from "@/core/components/BorderedSection";
import { InfoColumns } from "@/core/components/InfoColumns";
import { TabSection } from "@/core/components/TabSection";
import { useInfoColumns } from "./hooks/useInfoColumns";

export const Overview = () => {
  const infoColumns = useInfoColumns();


  return (
    <TabSection title="Overview">
      <BorderedSection title="Stage Details">
        <div>
          <InfoColumns infoRows={infoColumns} />
        </div>
      </BorderedSection>
    </TabSection>
  );
};
