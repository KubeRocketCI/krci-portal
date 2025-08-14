import { BorderedSection } from "@/core/components/BorderedSection";
import { InfoColumns } from "@/core/components/InfoColumns";
import { TabSection } from "@/core/components/TabSection";
import { useInfoColumns } from "./hooks/useInfoColumns";
import { useStageWatch } from "../../../../hooks";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const Overview = () => {
  const infoColumns = useInfoColumns();
  const stageWatch = useStageWatch();


  return (
    <TabSection title="Overview">
      <BorderedSection title="Stage Details">
        <div>
          <LoadingWrapper isLoading={stageWatch.query.isLoading}>
            <InfoColumns infoRows={infoColumns} />
          </LoadingWrapper>
        </div>
      </BorderedSection>
    </TabSection>
  );
};
