import { useTheme } from "@mui/material";
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
  const theme = useTheme();

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6" style={{ marginTop: theme.typography.pxToRem(16) }}>
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
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-6" style={{ marginTop: "16px" }}>
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
