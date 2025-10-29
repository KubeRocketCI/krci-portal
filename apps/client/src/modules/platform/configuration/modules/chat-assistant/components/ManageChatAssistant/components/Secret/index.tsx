import { ApiUrl, AssistantId, Token } from './fields';

export const SecretForm = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <ApiUrl />
        </div>
        <div className="col-span-6">
          <AssistantId />
        </div>
      </div>
      <div>
        <Token />
      </div>
    </div>
  );
};
