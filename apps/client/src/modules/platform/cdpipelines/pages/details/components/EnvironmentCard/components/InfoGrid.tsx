import { Stage } from "@my-project/shared";
import { useInfoColumns } from "../hooks/useInfoColumns";

interface InfoGridProps {
  stage: Stage;
}

export const InfoGrid = ({ stage }: InfoGridProps) => {
  const infoColumns = useInfoColumns(stage);

  return (
    <div className="grid grid-cols-5 gap-3">
      {infoColumns.map((column) => (
        <div key={column.label}>
          <div className="text-muted-foreground mb-1 flex items-center gap-2">
            {column.icon}
            <span className="text-xs">{column.label}</span>
          </div>
          {column.content}
        </div>
      ))}
    </div>
  );
};
