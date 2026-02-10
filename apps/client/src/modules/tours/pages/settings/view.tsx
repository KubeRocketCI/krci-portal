import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Presentation } from "lucide-react";
import { ToursList } from "../../components/ToursList";

export default function ToursSettingsPageContent() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Settings" }, { label: "Tours" }]}>
      <Section
        icon={Presentation}
        title="Portal Tours"
        description="Manage and replay interactive feature tours. View your progress and reset completed tours."
      >
        <ToursList />
      </Section>
    </PageWrapper>
  );
}
