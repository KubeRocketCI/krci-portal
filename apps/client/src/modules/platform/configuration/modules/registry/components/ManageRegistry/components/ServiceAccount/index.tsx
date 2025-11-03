import { IrsaRoleArn } from "./fields";

export const ServiceAccountForm = () => {
  return (
    <div>
      <div className="flex flex-col gap-4">
        <div>
          <h6 className="text-base font-medium">Authentication</h6>
        </div>
        <div>
          <IrsaRoleArn />
        </div>
      </div>
    </div>
  );
};
