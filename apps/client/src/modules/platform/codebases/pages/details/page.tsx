import { DataContextProvider } from "./providers/Data/provider";
import CodebaseDetailsPageContent from "./view";

export default function CodebaseDetailsPage() {
  return (
    <DataContextProvider>
      <CodebaseDetailsPageContent />
    </DataContextProvider>
  );
}
