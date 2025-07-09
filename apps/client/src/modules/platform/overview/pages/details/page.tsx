import { DialogContextProvider } from "@/core/providers/Dialog/provider";
import OverviewListPageContent from "./view";
import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";
import { UserWidgetsProvider } from "./providers/UserWidgets";

export default function OverviewDetailsPage() {
  return (
    <DialogContextProvider>
      <ResourceActionListContextProvider>
        <UserWidgetsProvider>
          <OverviewListPageContent />
        </UserWidgetsProvider>
      </ResourceActionListContextProvider>
    </DialogContextProvider>
  );
}
