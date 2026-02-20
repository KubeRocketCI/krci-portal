import { Button } from "@/core/components/ui/button";
import { useClusterStore } from "@/k8s/store";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { Codebase } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";

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
        to={PATH_PROJECT_DETAILS_FULL}
        params={{
          clusterName,
          name: appCodebase.metadata.name,
          namespace: appCodebase.metadata.namespace || defaultNamespace,
        }}
      >
        <ENTITY_ICON.project className="text-muted-foreground/70" />
        {appCodebase.metadata.name}
      </Link>
    </Button>
  );
};
