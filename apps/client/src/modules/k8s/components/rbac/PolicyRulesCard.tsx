import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";

export interface PolicyRule {
  verbs: string[];
  apiGroups?: string[];
  resources?: string[];
  resourceNames?: string[];
  nonResourceURLs?: string[];
}

const list = (arr?: string[]) => (arr && arr.length ? arr.join(", ") : "—");

/** Renders the policy rules of a Role / ClusterRole as a table. */
export function PolicyRulesCard({ rules }: { rules: PolicyRule[] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-baseline justify-between text-base font-semibold">
          <span>Policy Rules</span>
          <span className="text-muted-foreground text-xs">{rules.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rules.length === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">No rules.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="px-4 py-2 font-medium">API Groups</th>
                  <th className="px-4 py-2 font-medium">Resources</th>
                  <th className="px-4 py-2 font-medium">Resource Names</th>
                  <th className="px-4 py-2 font-medium">Verbs</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => (
                  <tr key={i} className="border-b align-top last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{list(rule.apiGroups?.map((g) => g || "core"))}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {rule.nonResourceURLs?.length ? list(rule.nonResourceURLs) : list(rule.resources)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{list(rule.resourceNames)}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {rule.verbs.map((v) => (
                          <Badge key={v} variant="outline" className="text-[10px]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
