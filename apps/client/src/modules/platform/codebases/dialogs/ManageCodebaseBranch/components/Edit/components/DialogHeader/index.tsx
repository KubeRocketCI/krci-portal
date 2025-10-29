import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";

export const DialogHeader = () => {
  const {
    props: { codebaseBranch },
  } = useCurrentDialog();

  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">{`Edit ${codebaseBranch?.spec.branchName}`}</h2>
      </div>
    </div>
  );
};
