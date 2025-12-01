import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";
import { ciTool } from "@my-project/shared";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";

export const CiToolField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext();
  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const gitServerFieldValue = watch(NAMES.gitServer);
  const selectedGitServer = gitServers.find((gitServer) => gitServer.metadata.name === gitServerFieldValue);

  const isGitlabProvider = selectedGitServer?.spec.gitProvider === "gitlab";

  const ciToolOptions = [
    { label: "Tekton", value: ciTool.tekton },
    ...(isGitlabProvider ? [{ label: "GitLab CI", value: ciTool.gitlab }] : []),
  ];

  return (
    <FormSelect
      {...register(NAMES.ciTool)}
      label="CI Pipelines"
      control={control}
      errors={errors}
      options={ciToolOptions}
      disabled={!isGitlabProvider}
    />
  );
};
