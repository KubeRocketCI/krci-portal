import React from "react";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { inClusterName } from "@my-project/shared";
import z from "zod";
import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

const defaultClusterOption = {
  label: inClusterName,
  value: inClusterName,
};

export const Cluster = () => {
  const form = useCreateStageForm();
  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;

  const clusterOptions = React.useMemo(() => {
    if (krciConfigMapWatch.isLoading || !krciConfigMap?.data?.available_clusters) {
      return [defaultClusterOption];
    }

    const availableClusters = krciConfigMap?.data?.available_clusters?.split(", ");
    const clusters = availableClusters.map((name: string) => ({ label: name, value: name }));

    return [defaultClusterOption, ...clusters];
  }, [krciConfigMapWatch.isLoading, krciConfigMap?.data?.available_clusters]);

  return (
    <form.AppField
      name={NAMES.cluster}
      validators={{
        onChange: z.string().min(1, "Select cluster"),
      }}
      children={(field) => <field.FormSelect label="Cluster" placeholder="Select cluster" options={clusterOptions} />}
    />
  );
};
