import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useClusterStore } from "@/k8s/store";
import { routeClustersConfiguration } from "@/modules/platform/configuration/modules/clusters/route";
import { inClusterName } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { STAGE_FORM_NAMES } from "../../../names";
import { useStageForm } from "../../../providers/form/hooks";

const defaultClusterOption = {
  label: inClusterName,
  value: inClusterName,
};

export const Cluster = () => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const form = useStageForm();

  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;

  const clusterOptions = React.useMemo(() => {
    if (krciConfigMapWatch.isLoading || !krciConfigMap?.data?.available_clusters) {
      return [defaultClusterOption];
    }

    const availableClusters = krciConfigMap?.data?.available_clusters?.split(", ");

    const clusters = availableClusters.map((name: string) => ({
      label: name,
      value: name,
    }));

    return [defaultClusterOption, ...clusters];
  }, [krciConfigMapWatch.isLoading, krciConfigMap?.data?.available_clusters]);

  return (
    <form.AppField
      name={STAGE_FORM_NAMES.cluster.name}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Select cluster";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Cluster"
          tooltipText={
            <>
              Select the Kubernetes cluster for the environment deployment. Make sure it matches the deployment needs.
              To manage clusters, visit the section in the{" "}
              <Link
                to={routeClustersConfiguration.fullPath}
                params={{
                  clusterName,
                }}
              >
                Configuration tab.
              </Link>
              <br />
              <Link to={EDP_USER_GUIDE.CLUSTER_CREATE.url} target="_blank">
                More details
              </Link>
              .
            </>
          }
          options={clusterOptions}
        />
      )}
    </form.AppField>
  );
};
