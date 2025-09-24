import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { ValueOf } from "@/core/types/global";
import { useConfigMapWatchList } from "@/k8s/api/groups/Core/ConfigMap";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useClusterStore } from "@/k8s/store";
import { routeClustersConfiguration } from "@/modules/platform/configuration/modules/clusters/route";
import { inClusterName, krciConfigMapNames } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../names";

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

  const configMapListWatch = useConfigMapWatchList();

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
