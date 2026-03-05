import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Presentation } from "lucide-react";
import { ToursList } from "../../components/ToursList";

export default function ToursSettingsPageContent() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Settings" }, { label: "Tours" }]}>
      <PageContentWrapper
        icon={Presentation}
        title="Portal Tours"
        description="Manage and replay interactive feature tours. View your progress and reset completed tours."
      >
        <ToursList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
