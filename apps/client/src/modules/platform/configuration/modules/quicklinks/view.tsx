import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { QuickLinkList } from "./components/QuickLinkList";

export default function QuickLinkListPageContent() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Overview" }]}>
      <Section
        description={
          <>
            Configure links for quick access to required tools. <LearnMoreLink url={EDP_USER_GUIDE.QUICK_LINKS.url} />
          </>
        }
      >
        <QuickLinkList />
      </Section>
    </PageWrapper>
  );
}
