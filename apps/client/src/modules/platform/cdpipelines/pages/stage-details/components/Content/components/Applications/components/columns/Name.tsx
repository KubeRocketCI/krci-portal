import { Button } from "@/core/components/ui/button";
import { useClusterStore } from "@/core/store";
import { routeComponentDetails } from "@/modules/platform/codebases/pages/details/route";
import { Codebase } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";

export const NameColumn = ({ appCodebase }: { appCodebase: Codebase }) => {
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  return (
    <Button variant="link" asChild className="p-0">
      <Link
        to={routeComponentDetails.to}
        params={{
          clusterName,
          name: appCodebase.metadata.name,
          namespace: appCodebase.metadata.namespace || defaultNamespace,
        }}
      >
        {appCodebase.metadata.name}
      </Link>
    </Button>
  );
};
