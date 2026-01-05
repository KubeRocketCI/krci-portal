import { TableUI, TableBodyUI, TableCellUI, TableRowUI } from "@/core/components/ui/table";

import { PipelineRun } from "@my-project/shared";

export const PipelineRunResults = ({ pipelineRun }: { pipelineRun: PipelineRun }) => {
  const results = pipelineRun?.status?.results || [];

  if (results.length === 0) {
    return null;
  }

  return (
    <TableUI>
      <colgroup>
        <col className="w-[30%]" />
        <col className="w-[70%]" />
      </colgroup>
      <TableBodyUI>
        {results.map((el, index) => (
          <TableRowUI key={index}>
            <TableCellUI className="h-8 text-sm font-medium">{el.name}</TableCellUI>
            <TableCellUI className="h-8 text-sm">{el.value}</TableCellUI>
          </TableRowUI>
        ))}
      </TableBodyUI>
    </TableUI>
  );
};
