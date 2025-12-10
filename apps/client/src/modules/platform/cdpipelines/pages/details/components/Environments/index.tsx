import { StageList } from "../StageList";
import { StageListFilter } from "../StageListFilter";
import { CreateEnvironmentButton } from "../CreateEnvironmentButton";

export const Environments = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <StageListFilter />
        <CreateEnvironmentButton />
      </div>
      <StageList />
    </div>
  );
};
