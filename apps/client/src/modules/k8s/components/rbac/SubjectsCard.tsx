import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";

export interface RbacSubject {
  kind: string;
  name: string;
  namespace?: string;
  apiGroup?: string;
}

/** Renders the subjects of a RoleBinding / ClusterRoleBinding as a table. */
export function SubjectsCard({ subjects }: { subjects: RbacSubject[] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-baseline justify-between text-base font-semibold">
          <span>Subjects</span>
          <span className="text-muted-foreground text-xs">{subjects.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {subjects.length === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">No subjects.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="px-4 py-2 font-medium">Kind</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Namespace</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 text-xs">{s.kind}</td>
                    <td className="px-4 py-2 font-mono text-xs">{s.name}</td>
                    <td className="text-muted-foreground px-4 py-2 font-mono text-xs">{s.namespace ?? "—"}</td>
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
