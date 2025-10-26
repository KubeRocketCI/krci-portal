import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FROM_TEMPLATE_FORM_NAMES } from "../../../names";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { ciTool } from "@my-project/shared";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";

export const CiTool = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();
  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const gitServerFieldValue = watch(CODEBASE_FROM_TEMPLATE_FORM_NAMES.GIT_SERVER);
  const selectedGitServer = gitServers.find((gitServer) => gitServer.metadata.name === gitServerFieldValue);

  const isGitlabProvider = selectedGitServer?.spec.gitProvider === "gitlab";

  const ciToolOptions = [
    { label: "Tekton", value: ciTool.tekton },
    ...(isGitlabProvider ? [{ label: "GitLab CI", value: ciTool.gitlab }] : []),
  ];

  return (
    <FormSelect
      {...register(CODEBASE_FROM_TEMPLATE_FORM_NAMES.CI_TOOL)}
      label="CI Pipelines"
      control={control}
      errors={errors}
      options={ciToolOptions}
      disabled={!isGitlabProvider}
    />
  );
};
