import { CLUSTER_FORM_NAMES } from "../../constants";
import { useClusterSecretForm } from "../../providers/form/hooks";
import { ClusterFormFields } from "../ClusterFormFields";

export const Form = () => {
  const form = useClusterSecretForm();

  return (
    <form.AppField name={CLUSTER_FORM_NAMES.CLUSTER_TYPE}>
      {(field) => <ClusterFormFields activeClusterType={field.state.value} onClusterTypeChange={field.handleChange} />}
    </form.AppField>
  );
};
