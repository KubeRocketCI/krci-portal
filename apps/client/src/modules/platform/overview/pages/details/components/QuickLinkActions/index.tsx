import { useResourceActionListContext } from "@/core/providers/ResourceActionList/hooks";
import { QuickLinkActionsMenu } from "@/modules/platform/configuration/modules/quicklinks/components/QuickLinkActionsMenu";
import { QuickLink } from "@my-project/shared";

export const QuickLinkActions = () => {
  const { data, anchorEl, handleCloseResourceActionListMenu } = useResourceActionListContext<QuickLink>();

  return (
    anchorEl && (
      <QuickLinkActionsMenu
        data={{
          quickLink: data,
        }}
        anchorEl={anchorEl}
        handleCloseResourceActionListMenu={handleCloseResourceActionListMenu}
        variant="menu"
      />
    )
  );
};
