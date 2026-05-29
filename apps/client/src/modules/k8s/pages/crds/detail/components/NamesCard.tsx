import { Card, CardHeader, CardTitle, CardContent } from "@/core/components/ui/card";
import { TableUI, TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import type { CRDObject } from "@my-project/shared";

export function NamesCard({ crd }: { crd: CRDObject }) {
  const n = crd.spec.names;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Names</CardTitle>
      </CardHeader>
      <CardContent>
        <TableUI>
          <TableHeaderUI>
            <TableRowUI>
              <TableHeadUI scope="col">Kind</TableHeadUI>
              <TableHeadUI scope="col">Plural</TableHeadUI>
              <TableHeadUI scope="col">Singular</TableHeadUI>
              <TableHeadUI scope="col">ListKind</TableHeadUI>
            </TableRowUI>
          </TableHeaderUI>
          <TableBodyUI>
            <TableRowUI>
              <TableCellUI>{n.kind}</TableCellUI>
              <TableCellUI>{n.plural}</TableCellUI>
              <TableCellUI>{n.singular ?? "—"}</TableCellUI>
              <TableCellUI>{n.listKind ?? "—"}</TableCellUI>
            </TableRowUI>
          </TableBodyUI>
        </TableUI>
      </CardContent>
    </Card>
  );
}
