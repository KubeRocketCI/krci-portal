import { Globe } from "lucide-react";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { ClusterInterceptorList } from "./components/ClusterInterceptorList";

export default function ClusterInterceptorListView() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Webhook Triggers" }, { label: "Cluster Interceptors" }]}>
      <PageContentWrapper
        icon={Globe}
        title="Cluster Interceptors"
        description="Cluster-scoped interceptor implementations (e.g. CEL, GitHub, GitLab) shipped by Tekton Triggers."
      >
        <div className="flex flex-grow flex-col gap-6">
          <ClusterInterceptorList />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
