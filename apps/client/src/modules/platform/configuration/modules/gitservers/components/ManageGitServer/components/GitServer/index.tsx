import {
  GitProviderField,
  HostName,
  HTTPSPort,
  Name,
  OverrideWebhookURL,
  SkipWebHookSSL,
  SSHPort,
  UserName,
  WebHookURL,
} from "./components/fields";

export const GitServerForm = () => {
  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6 mt-4">
          <Name />
        </div>
        <div className="col-span-6">
          <GitProviderField />
        </div>
        <div className="col-span-12">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <HostName />
            </div>
            <div className="col-span-6">
              <UserName />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <SSHPort />
            </div>
            <div className="col-span-6">
              <HTTPSPort />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <div className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-6 mt-4">
              <OverrideWebhookURL />
            </div>
            <div className="col-span-6">
              <WebHookURL />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <SkipWebHookSSL />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
