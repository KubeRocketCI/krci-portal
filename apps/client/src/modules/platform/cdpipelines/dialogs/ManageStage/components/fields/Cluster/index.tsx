import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../names";
import { ConfigMap, inClusterName, k8sConfigMapConfig, krciConfigMapNames } from "@my-project/shared";
import { useWatchList } from "@/k8s/api/hooks/useWatchList";
import { ValueOf } from "@/core/types/global";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { routeClustersConfiguration } from "@/modules/platform/configuration/pages/clusters/route";
import { Link } from "@tanstack/react-router";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

const defaultClusterOption = {
  label: inClusterName,
  value: inClusterName,
};

export const Cluster = () => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  const configMapListWatch = useWatchList<ConfigMap>({
    resourceConfig: k8sConfigMapConfig,
  });

  const configMapList = configMapListWatch.dataArray;

  const krciConfigMap = configMapList.find((configMap) =>
    Object.values(krciConfigMapNames).includes(configMap.metadata.name as ValueOf<typeof krciConfigMapNames>)
  );

  const clusterOptions = React.useMemo(() => {
    if (configMapListWatch.query.isLoading || !krciConfigMap?.data?.available_clusters) {
      return [defaultClusterOption];
    }

    const availableClusters = krciConfigMap?.data?.available_clusters?.split(", ");

    const clusters = availableClusters.map((name: string) => ({
      label: name,
      value: name,
    }));

    return [defaultClusterOption, ...clusters];
  }, [configMapListWatch.query.isLoading, krciConfigMap?.data?.available_clusters]);

  return (
    <FormSelect
      {...register(STAGE_FORM_NAMES.cluster.name, {
        required: "Select cluster",
      })}
      label={"Cluster"}
      tooltipText={
        <>
          Select the Kubernetes cluster for the environment deployment. Make sure it matches the deployment needs. To
          manage clusters, visit the section in the{" "}
          <Link
            to={routeClustersConfiguration.fullPath}
            params={{
              clusterName,
            }}
          >
            Configuration tab.
          </Link>
          <br />
          <Link to={EDP_USER_GUIDE.CLUSTER_CREATE.url} target={"_blank"}>
            More details
          </Link>
          .
        </>
      }
      control={control}
      errors={errors}
      options={clusterOptions}
    />
  );
};
