import type { ExposedSecretsRequest } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { LEVEL_META } from "@/modules/platform/security/components/defectdojo/constants";
import {
  PlatformFindingsList,
  type PlatformFindingsListProps,
} from "@/modules/platform/security/components/defectdojo/PlatformFindingsList";
import { NotConfiguredState, UnreachableState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { useFindingFilterData } from "@/modules/platform/security/components/defectdojo/useFindingFilterData";
import { useExposedSecrets } from "../../hooks/useExposedSecrets";
import type { Search } from "../../route";
import { searchToInputs, withFilters, withPage, withRowsPerPage } from "../../utils/search";
import { ExposedSecretsFilters } from "../ExposedSecretsFilters";

/** A secret finding's title names the rule that matched; its location is a file, with a line for Code. */
const SECRET_HEADERS: PlatformFindingsListProps["headers"] = { finding: "Rule", location: "File : line" };

export interface ExposedSecretsProps {
  search: Search;
  onSearchChange: (search: Search) => void;
  /** The installation namespace: its Stages, Applications and Codebases. */
  namespace: string;
  clusterName: string;
}

interface ListCardProps extends Pick<PlatformFindingsListProps, "query" | "onPageChange" | "onRowsPerPageChange"> {
  level: ExposedSecretsRequest["level"];
  title: string;
  /** `null`: not asked for; the card shows `unaskedNote` instead. */
  input: ExposedSecretsRequest | null;
  unaskedNote?: string;
  clusterName: string;
}

function ListCard({ level, title, input, unaskedNote, clusterName, ...listProps }: ListCardProps) {
  const Icon = LEVEL_META[level].icon;

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" aria-hidden />
        {title}
      </h3>
      {input ? (
        <PlatformFindingsList
          {...listProps}
          input={input}
          columns="code"
          caption={title}
          name={title}
          what="secret findings"
          headers={SECRET_HEADERS}
          clusterName={clusterName}
        />
      ) : (
        <p className="text-muted-foreground p-3 text-sm">{unaskedNote}</p>
      )}
    </Card>
  );
}

export function ExposedSecrets({ search, onSearchChange, namespace, clusterName }: ExposedSecretsProps) {
  const inputs = searchToInputs(search, namespace);
  const code = useExposedSecrets(inputs.code);
  const runtime = useExposedSecrets(inputs.runtime);
  const filterData = useFindingFilterData({ namespace, clusters: search.cluster });

  const states = [code.data?.state, runtime.data?.state];
  // refetch() runs a skipToken query and fails it ("Missing queryFn"): refetch only the lists that are asked for.
  const retry = () => {
    void code.refetch();
    if (inputs.runtime) void runtime.refetch();
  };
  const onRowsPerPageChange = (rowsPerPage: number) => onSearchChange(withRowsPerPage(search, rowsPerPage));

  const filters = (
    <ExposedSecretsFilters
      search={search}
      {...filterData}
      onChange={(patch) => onSearchChange(withFilters(search, patch))}
    />
  );

  // Both lists read one DefectDojo: a missing or failing connection shows once for the page.
  const notConfigured = states.includes("notConfigured");
  if (notConfigured || states.includes("unreachable")) {
    return (
      <div className="space-y-4">
        {filters}
        <Card className="p-4">
          {notConfigured ? (
            <NotConfiguredState />
          ) : (
            <UnreachableState
              what="Exposed secrets"
              wholePage
              onRetry={retry}
              isRetrying={code.isFetching || runtime.isFetching}
            />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filters}
      <ListCard
        level="code"
        title="Secrets in source code"
        input={inputs.code}
        query={code}
        onPageChange={(page) => onSearchChange(withPage(search, "code", page))}
        onRowsPerPageChange={onRowsPerPageChange}
        clusterName={clusterName}
      />
      <ListCard
        level="runtime"
        title="Secrets in running workloads"
        input={inputs.runtime}
        unaskedNote="Running workloads have no Mitigated state: closing a scan mitigates every finding of its test."
        query={runtime}
        onPageChange={(page) => onSearchChange(withPage(search, "runtime", page))}
        onRowsPerPageChange={onRowsPerPageChange}
        clusterName={clusterName}
      />
    </div>
  );
}
