import { Table } from "@/core/components/Table";
import { useColumns } from "./hooks/useColumns";
import { TABLE } from "@/k8s/constants/tables";
import { useQuickLinkWatchList, useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { useShallow } from "zustand/react/shallow";
import { useClusterStore } from "@/k8s/store";
import { QuickLinkFilter } from "../QuickLinkFilter";
import { useQuickLinkFilter } from "../QuickLinkFilter/hooks/useFilter";
import React from "react";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { Plus } from "lucide-react";
import { Stack } from "@mui/material";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageQuickLinkDialog } from "../../dialogs/ManageQuickLink";

export const QuickLinkList = () => {
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  const columns = useColumns();

  const quickLinksWatch = useQuickLinkWatchList({
    namespace,
  });

  const quickLinkPermissions = useQuickLinkPermissions();
  const openManageQuickLinkDialog = useDialogOpener(ManageQuickLinkDialog);

  const { filterFunction } = useQuickLinkFilter();

  const tableSlots = React.useMemo(
    () => ({
      header: <QuickLinkFilter />,
    }),
    []
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="flex-end" alignItems="center">
        <ButtonWithPermission
          ButtonProps={{
            startIcon: <Plus size={16} />,
            color: "primary",
            variant: "contained",
            onClick: () => {
              openManageQuickLinkDialog({ quickLink: undefined });
            },
          }}
          allowed={quickLinkPermissions.data.create.allowed}
          reason={quickLinkPermissions.data.create.reason}
        >
          add link
        </ButtonWithPermission>
      </Stack>
      <Table
        id={TABLE.QUICKLINK_LIST.id}
        name={TABLE.QUICKLINK_LIST.name}
        isLoading={!quickLinksWatch.isReady}
        data={quickLinksWatch.data.array}
        errors={[]}
        columns={columns}
        filterFunction={filterFunction}
        slots={tableSlots}
      />
    </Stack>
  );
};
