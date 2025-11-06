import { DialogContextProvider } from "@/core/providers/Dialog/provider";
import OverviewListPageContent from "./view";
import { UserWidgetsProvider } from "./providers/UserWidgets";

export default function OverviewDetailsPage() {
  return (
    <DialogContextProvider>
      <UserWidgetsProvider>
        <OverviewListPageContent />
      </UserWidgetsProvider>
    </DialogContextProvider>
  );
}
