import { ComponentList } from "./components/ComponentList";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";

export default function ComponentListPageContent() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Components" }]}>
      <Section
        description={
          <>
            Create, view, and manage diverse codebases, encompassing applications, libraries, autotests, and Terraform
            infrastructure code. <LearnMoreLink url={EDP_USER_GUIDE.APPLICATION_CREATE.url} />
          </>
        }
      >
        <ComponentList />
      </Section>
    </PageWrapper>
  );
}
