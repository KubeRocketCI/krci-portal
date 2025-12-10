import { NameValueTable } from "@/core/components/NameValueTable";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { usePipelineRunWatchItem } from "@/k8s/api/groups/Tekton/PipelineRun";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { routePipelineRunDetails } from "../../route";
import { Link } from "@tanstack/react-router";
import { Card } from "@/core/components/ui/card";

export const Results = () => {
  const params = routePipelineRunDetails.useParams();

  const pipelineRunWatch = usePipelineRunWatchItem({
    namespace: params.namespace,
    name: params.name,
  });

  const pipelineRun = pipelineRunWatch.query.data;

  return (
    <Card>
      <NameValueTable
        rows={(pipelineRun?.status?.results || []).map((el: Record<string, string>) => {
          const isLink = getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS).test(el.value);

          return {
            name: el.name,
            value: isLink ? (
              <Link to={el.value} target="_blank">
                {el.value}
              </Link>
            ) : (
              el.value
            ),
          };
        })}
      />
    </Card>
  );
};
