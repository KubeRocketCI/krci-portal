import { Password, User } from "./fields";

export const SecretForm = () => {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-6">
        <User />
      </div>
      <div className="col-span-6">
        <Password />
      </div>
    </div>
  );
};
