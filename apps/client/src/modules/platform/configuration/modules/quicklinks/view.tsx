import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { QuickLinkList } from "./components/QuickLinkList";
import { Settings } from "lucide-react";

export default function QuickLinkListPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "QuickLinks" }]}
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.QUICK_LINKS.url} />}
    >
      <PageContentWrapper
        icon={Settings}
        title="QuickLinks"
        description="Configure links for quick access to required tools."
      >
        <QuickLinkList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
