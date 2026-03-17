import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { QuickLinkList } from "./components/QuickLinkList";
import { Settings, Plus } from "lucide-react";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageQuickLinkDialog } from "./dialogs/ManageQuickLink";

export default function QuickLinkListPageContent() {
  const quickLinkPermissions = useQuickLinkPermissions();
  const openManageQuickLinkDialog = useDialogOpener(ManageQuickLinkDialog);

  return (
    <PageWrapper
      breadcrumbs={[{ label: "QuickLinks" }]}
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.QUICK_LINKS.url} />}
    >
      <PageContentWrapper
        icon={Settings}
        title="QuickLinks"
        description="Configure links for quick access to required tools."
        actions={
          <ButtonWithPermission
            ButtonProps={{
              variant: "default",
              onClick: () => openManageQuickLinkDialog({ quickLink: undefined }),
            }}
            allowed={quickLinkPermissions.data.create.allowed}
            reason={quickLinkPermissions.data.create.reason}
          >
            <Plus size={16} />
            Add Link
          </ButtonWithPermission>
        }
      >
        <QuickLinkList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
