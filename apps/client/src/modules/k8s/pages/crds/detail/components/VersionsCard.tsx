import { Card, CardHeader, CardTitle, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { TableUI, TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import type { CRDObject } from "@my-project/shared";

export function VersionsCard({ crd }: { crd: CRDObject }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Versions</CardTitle>
      </CardHeader>
      <CardContent>
        <TableUI>
          <TableHeaderUI>
            <TableRowUI>
              <TableHeadUI scope="col">Name</TableHeadUI>
              <TableHeadUI scope="col">Served</TableHeadUI>
              <TableHeadUI scope="col">Storage</TableHeadUI>
            </TableRowUI>
          </TableHeaderUI>
          <TableBodyUI>
            {crd.spec.versions.length === 0 ? (
              <TableRowUI>
                <TableCellUI colSpan={3} className="text-muted-foreground text-center text-sm">
                  No versions defined.
                </TableCellUI>
              </TableRowUI>
            ) : (
              crd.spec.versions.map((v) => (
                <TableRowUI key={v.name} className={v.storage ? "font-semibold" : undefined}>
                  <TableCellUI>{v.name}</TableCellUI>
                  <TableCellUI>
                    <Badge variant={v.served ? "success" : "secondary"}>{v.served ? "True" : "False"}</Badge>
                  </TableCellUI>
                  <TableCellUI>
                    <Badge variant={v.storage ? "success" : "secondary"}>{v.storage ? "True" : "False"}</Badge>
                  </TableCellUI>
                </TableRowUI>
              ))
            )}
          </TableBodyUI>
        </TableUI>
      </CardContent>
    </Card>
  );
}
