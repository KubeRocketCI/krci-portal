import { ClientId, ClientSecret } from "./fields";

export const CodemieSecretForm = () => {
  return (
    <>
      <h6 className="text-base font-medium">Credentials</h6>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <ClientId />
        </div>
        <div className="col-span-6">
          <ClientSecret />
        </div>
      </div>
    </>
  );
};
