import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import type { ActorRow } from "@my-project/shared";
import { useClusterStore } from "@/k8s/store";
import { PATH_FACTORY_AGENT_DETAIL_FULL } from "../../../../constants/paths";

export function useAgentRowClick() {
  const navigate = useNavigate();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return React.useCallback(
    (_event: React.MouseEvent<HTMLTableRowElement>, actor: ActorRow) => {
      void navigate({
        to: PATH_FACTORY_AGENT_DETAIL_FULL,
        params: { clusterName, atespace: actor.atespace, name: actor.name },
      });
    },
    [navigate, clusterName]
  );
}
