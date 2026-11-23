import React from "react";
import { Cpu, Database, Info } from "lucide-react";
import type { ActorRow } from "@my-project/shared";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { actorDetailTabEnum, type ActorDetailTab } from "../../../../../constants/tabs";
import { ActorRuntime } from "../ActorRuntime";
import { ActorSnapshots } from "../ActorSnapshots";
import { ActorSummary } from "../ActorSummary";

const TAB_IDS = actorDetailTabEnum.options;

interface ActorDetailProps {
  actor: ActorRow;
  tab: ActorDetailTab;
  onTabChange: (tab: ActorDetailTab) => void;
}

/** `Tabs` keeps visited tabs mounted: tab state, such as the snapshot table sort, survives switching. */
export function ActorDetail({ actor, tab, onTabChange }: ActorDetailProps) {
  const tabs = React.useMemo<(Tab & { id: ActorDetailTab })[]>(() => {
    const byId: Record<ActorDetailTab, Tab & { id: ActorDetailTab }> = {
      summary: {
        id: "summary",
        label: "Summary",
        icon: <Info className="size-4" />,
        component: (
          <section aria-label="Summary">
            <ActorSummary actor={actor} />
          </section>
        ),
      },
      runtime: {
        id: "runtime",
        label: "Runtime",
        icon: <Cpu className="size-4" />,
        component: (
          <section aria-label="Runtime">
            <ActorRuntime actor={actor} />
          </section>
        ),
      },
      snapshot: {
        id: "snapshot",
        label: "Snapshot",
        icon: <Database className="size-4" />,
        component: (
          <section aria-label="Snapshot">
            <ActorSnapshots snapshots={actor.snapshots} />
          </section>
        ),
      },
    };
    return TAB_IDS.map((id) => byId[id]);
  }, [actor]);

  return (
    <Tabs
      tabs={tabs}
      activeTabIdx={Math.max(0, TAB_IDS.indexOf(tab))}
      handleChangeTab={(_event, index) => onTabChange(TAB_IDS[index])}
    />
  );
}
