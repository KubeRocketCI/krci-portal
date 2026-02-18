import {
  GitProviderField,
  HostName,
  HTTPSPort,
  Name,
  OverrideWebhookURL,
  SkipWebHookSSL,
  SSHPort,
  TektonDisabled,
  UserName,
} from "./components/fields";
import { SyncGitProviderDefaults } from "./components/SyncGitProviderDefaults";

export const GitServerForm = () => {
  return (
    <>
      <SyncGitProviderDefaults />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <GitProviderField />
        </div>
        <div className="col-span-6">
          <Name />
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
          <OverrideWebhookURL />
        </div>
        <div className="col-span-12">
          <SkipWebHookSSL />
        </div>
        <div className="col-span-12">
          <TektonDisabled />
        </div>
      </div>
    </>
  );
};
