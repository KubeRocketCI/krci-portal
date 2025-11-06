import { Alert } from "@/core/components/ui/alert";
import { useDataContext } from "../../providers/Data/hooks";
import { ExternalURL } from "./fields/ExternalURL";

export const QuickLinkForm = () => {
  const { quickLink } = useDataContext();

  return (
    <div className="flex flex-col gap-2">
      {!quickLink && (
        <div>
          <Alert variant="default">
            DependencyTrack QuickLink has not been found. Please, create it first in order to manage the integration.
          </Alert>
        </div>
      )}
      <ExternalURL />
    </div>
  );
};
