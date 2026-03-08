import { NameValueTable } from "@/core/components/NameValueTable";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { Link } from "@tanstack/react-router";
import { Card } from "@/core/components/ui/card";
import { EmptyList } from "@/core/components/EmptyList";

interface ResultsViewProps {
  results: Record<string, string>[];
}

/**
 * Presentational component for PipelineRun results.
 * Renders a name-value table with URL detection and link rendering.
 */
export function ResultsView({ results }: ResultsViewProps) {
  if (results.length === 0) {
    return (
      <Card>
        <EmptyList customText="No results found!" description="Results appear only if the pipeline produces them." />
      </Card>
    );
  }

  return (
    <Card>
      <NameValueTable
        rows={results.map((el) => {
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
}
