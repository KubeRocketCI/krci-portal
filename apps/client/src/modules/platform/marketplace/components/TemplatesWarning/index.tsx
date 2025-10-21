import { EmptyList } from "@/core/components/EmptyList";
import { useClusterStore } from "@/k8s/store";
import { PATH_CONFIG_GITSERVERS_FULL } from "@/modules/platform/configuration/modules/gitservers/route";
import { useShallow } from "zustand/react/shallow";

export const TemplatesWarning = () => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <EmptyList
      customText={"No Git Servers Connected."}
      linkText={"Click here to add a Git Server."}
      route={{
        to: PATH_CONFIG_GITSERVERS_FULL,
        params: {
          clusterName,
        },
      }}
    />
  );
};
