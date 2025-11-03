import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";

export const DialogHeader = () => {
  const {
    props: { quickLink },
  } = useCurrentDialog();

  return (
    <div className="flex items-start justify-between gap-1">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">{`Edit ${quickLink?.metadata.name}`}</h2>
      </div>
    </div>
  );
};
