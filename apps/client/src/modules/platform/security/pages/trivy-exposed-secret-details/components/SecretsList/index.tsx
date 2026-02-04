import { useMemo } from "react";
import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useSecretColumns } from "../../hooks/useSecretColumns";
import { ExposedSecretReport } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { ExposedSecretWithId } from "../../types";

interface SecretsListProps {
  report: ExposedSecretReport | undefined;
  isLoading: boolean;
}

export function SecretsList({ report, isLoading }: SecretsListProps) {
  const columns = useSecretColumns();

  const secretsWithIds: ExposedSecretWithId[] = useMemo(() => {
    if (!report?.report?.secrets) {
      return [];
    }

    return report.report.secrets.map((secret, index) => ({
      ...secret,
      id: `${secret.ruleID}-${index}`,
    }));
  }, [report?.report?.secrets]);

  return (
    <DataTable<ExposedSecretWithId>
      id={TABLE.TRIVY_EXPOSED_SECRETS_LIST.id}
      data={secretsWithIds}
      columns={columns}
      isLoading={isLoading}
      emptyListComponent={
        <EmptyList
          customText="No exposed secrets found"
          description="No secrets were detected in this container image"
        />
      }
      sort={{
        order: "desc",
        sortBy: "severity",
      }}
      pagination={{
        show: true,
      }}
      settings={{
        show: true,
      }}
    />
  );
}
