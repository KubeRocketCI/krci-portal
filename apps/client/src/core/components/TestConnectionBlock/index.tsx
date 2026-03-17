import { AlertRoot, AlertDescription } from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Plug, Loader2, CheckCircle2, XCircle, Globe } from "lucide-react";

export type TestConnectionStatus = "idle" | "loading" | "success" | "error";

interface TestConnectionBlockProps {
  status: TestConnectionStatus;
  error: string | null;
  onTest: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
  serviceName: string;
}

const statusConfig = {
  idle: {
    icon: <Globe size={16} />,
    className: "bg-background text-foreground",
  },
  loading: {
    icon: <Loader2 size={16} className="animate-spin" />,
    className: "bg-background text-foreground",
  },
  success: {
    icon: <CheckCircle2 size={16} />,
    className: "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
  },
  error: {
    icon: <XCircle size={16} />,
    className: "border-destructive bg-destructive/10 text-destructive",
  },
};

export const TestConnectionBlock = ({
  status,
  error,
  onTest,
  disabled = false,
  disabledTooltip = "Edit credentials to test the connection",
  serviceName,
}: TestConnectionBlockProps) => {
  const config = statusConfig[status];

  const getTitle = () => {
    switch (status) {
      case "idle":
        return "Test Connection";
      case "loading":
        return "Testing Connection...";
      case "success":
        return "Connection Successful";
      case "error":
        return "Connection Failed";
    }
  };

  const getDescription = () => {
    switch (status) {
      case "idle":
        return `Verify your ${serviceName} configuration works correctly`;
      case "loading":
        return `Connecting to ${serviceName}...`;
      case "success":
        return `Successfully connected to ${serviceName}`;
      case "error":
        return error || `Unable to connect to ${serviceName}`;
    }
  };

  return (
    <AlertRoot className={config.className}>
      {config.icon}
      <AlertDescription>
        <div className="flex w-full items-end justify-between gap-8">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{getTitle()}</p>
            <p className="text-xs opacity-80">{getDescription()}</p>
          </div>
          <ConditionalWrapper
            condition={disabled}
            wrapper={(children) => (
              <Tooltip title={disabledTooltip}>
                <div>{children}</div>
              </Tooltip>
            )}
          >
            <Button onClick={onTest} size="sm" variant="outline" disabled={disabled || status === "loading"}>
              {status === "loading" ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Testing...
                </>
              ) : (
                <>
                  <Plug size={16} /> Test Connection
                </>
              )}
            </Button>
          </ConditionalWrapper>
        </div>
      </AlertDescription>
    </AlertRoot>
  );
};
