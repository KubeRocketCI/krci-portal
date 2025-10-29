import { CleanTemplate, DeployTemplate, TriggerType } from "../../../fields";

export const Form = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-6">
            <TriggerType />
          </div>
        </div>
      </div>
      <div>
        <DeployTemplate />
      </div>
      <div>
        <CleanTemplate />
      </div>
    </div>
  );
};
