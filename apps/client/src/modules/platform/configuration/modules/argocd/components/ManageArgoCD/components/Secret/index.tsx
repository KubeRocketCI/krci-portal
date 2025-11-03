import { Token, URL } from "./fields";

export const SecretForm = () => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <URL />
      </div>
      <div>
        <Token />
      </div>
    </div>
  );
};
