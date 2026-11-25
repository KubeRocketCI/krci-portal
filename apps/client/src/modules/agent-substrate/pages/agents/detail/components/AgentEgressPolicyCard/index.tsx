import type { EgressCredential, EgressPolicyRead, EgressPorts, EgressRule, EgressRuleKind } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import type { TableColumn } from "@/core/components/Table/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { TABLE } from "@/k8s/constants/tables";
import { TextOrEmpty } from "../../../../../components/EmptyValue";
import { TERM_HINT } from "../../../../../constants/hints";
import { NO_EGRESS_POLICY_TEXT, UNREADABLE_EGRESS_POLICY_TEXT, unreadableReasonText } from "./text";

const TITLE_ID = "agent-egress-policy-title";

const KIND_LABEL: Record<EgressRuleKind, string> = {
  https: "HTTPS",
  tlsPassthrough: "TLS passthrough",
  http: "HTTP",
  unknown: "Unknown",
};

const portsText = (ports: EgressPorts) => (ports === "all" ? "All" : ports.join(", "));

/** The prefix is JSON-quoted so a trailing space stays visible. */
const credentialText = ({ header, prefix }: EgressCredential) =>
  prefix ? `${header} (${JSON.stringify(prefix)})` : header;

const columns: TableColumn<EgressRule>[] = [
  {
    id: "kind",
    label: "Rule",
    hint: TERM_HINT.egressRule,
    data: { render: ({ data }) => KIND_LABEL[data.kind] },
    cell: { baseWidth: 15 },
  },
  {
    id: "hosts",
    label: "Hosts",
    data: { render: ({ data }) => <TextOrEmpty text={data.hosts.join(", ")} /> },
    cell: { baseWidth: 40 },
  },
  {
    id: "ports",
    label: "Ports",
    data: { render: ({ data }) => <TextOrEmpty text={portsText(data.ports)} /> },
    cell: { baseWidth: 10 },
  },
  {
    id: "credentials",
    label: "Credentials",
    hint: TERM_HINT.egressCredentials,
    data: { render: ({ data }) => <TextOrEmpty text={data.credentials.map(credentialText).join(", ")} /> },
    cell: { baseWidth: 35 },
  },
];

const EMPTY_RULES = <EmptyList customText="The egress policy has no rules" />;

export function EgressPolicyBody({ egressPolicy }: { egressPolicy: EgressPolicyRead }) {
  switch (egressPolicy.state) {
    case "none":
      return <EmptyList customText={NO_EGRESS_POLICY_TEXT} />;
    case "unreadable":
      return (
        <EmptyList customText={UNREADABLE_EGRESS_POLICY_TEXT} description={unreadableReasonText(egressPolicy.reason)} />
      );
    case "ready":
      return (
        <div className="flex flex-col gap-2">
          <DataTable<EgressRule>
            id={TABLE.AGENT_EGRESS_RULE_LIST.id}
            name={TABLE.AGENT_EGRESS_RULE_LIST.name}
            data={egressPolicy.rules}
            columns={columns}
            emptyListComponent={EMPTY_RULES}
          />
          <p className="text-muted-foreground text-sm">
            {egressPolicy.rules.some((rule) => rule.kind === "unknown")
              ? "The egress policy holds a rule of a kind that the portal cannot show."
              : "Every other host is denied."}
          </p>
        </div>
      );
  }
}

export function AgentEgressPolicyCard({ egressPolicy }: { egressPolicy: EgressPolicyRead }) {
  return (
    <Card role="region" aria-labelledby={TITLE_ID}>
      <CardHeader className="p-4 pb-2">
        <CardTitle id={TITLE_ID} className="text-sm font-semibold">
          Egress policy
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <EgressPolicyBody egressPolicy={egressPolicy} />
      </CardContent>
    </Card>
  );
}
