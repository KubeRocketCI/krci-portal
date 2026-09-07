import { useCallback, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { EmptyList } from "@/core/components/EmptyList";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { DataTable } from "@/core/components/Table";
import { FilterProvider } from "@/core/providers/Filter";
import { usePagination } from "@/core/hooks/usePagination";
import type { KrciAuditEvent } from "@my-project/shared";
import { TABLE_ID_ADMIN_AUDIT_EVENTS } from "../../constants/tables";
import { AuditEventFilter } from "./components/AuditEventFilter";
import { defaultAuditEventFilterValues, matchFunctions } from "./components/AuditEventFilter/constants";
import { useDebouncedAuditEventFilterValues } from "./components/AuditEventFilter/hooks/useAuditEventFilter";
import { AUDIT_EVENTS_DEFAULT_PER_PAGE, AUDIT_EVENTS_MAX_PER_PAGE, useAuditEvents } from "./hooks/useAuditEvents";
import { useColumns } from "./hooks/useColumns";

export default function AdminAuditEventsPage() {
  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultAuditEventFilterValues}>
      <AdminAuditEventsContent />
    </FilterProvider>
  );
}

function AdminAuditEventsContent() {
  const columns = useColumns();
  const filterValues = useDebouncedAuditEventFilterValues();

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } = usePagination({
    initialPage: 0,
    initialRowsPerPage: AUDIT_EVENTS_DEFAULT_PER_PAGE,
  });
  const perPage = Math.min(rowsPerPage, AUDIT_EVENTS_MAX_PER_PAGE);

  const { events, total, isLoading, error } = useAuditEvents(filterValues, page + 1, perPage);

  // A filter change shrinks/changes the result set; snap back to the first page so the
  // user is never stranded on a now-out-of-range page (which the API returns empty).
  const filterKey = JSON.stringify(filterValues);
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (page !== 0) {
        handleChangePage(null, 0);
      }
    }
  }, [filterKey, page, handleChangePage]);

  const handlePageChange = useCallback((nextPage: number) => handleChangePage(null, nextPage), [handleChangePage]);

  // Same synthetic event the ui pager builds; `usePagination` parses `target.value`.
  const handleRowsPerPageChange = useCallback(
    (rows: number) => handleChangeRowsPerPage({ target: { value: String(rows) } } as ChangeEvent<HTMLInputElement>),
    [handleChangeRowsPerPage]
  );

  const tableSlots = useMemo(() => ({ header: { component: <AuditEventFilter /> } }), []);

  return (
    <PageWrapper breadcrumbs={[{ label: "Administration" }, { label: "Audit Events" }]}>
      <PageContentWrapper
        icon={ShieldCheck}
        title="Audit Events"
        description="Review the audit trail of who created, updated, and deleted resources across the platform."
      >
        <DataTable<KrciAuditEvent>
          id={TABLE_ID_ADMIN_AUDIT_EVENTS}
          mode="server"
          data={events}
          columns={columns}
          isLoading={isLoading}
          errors={error ? [error] : null}
          slots={tableSlots}
          pagination={{
            page,
            rowsPerPage: perPage,
            totalCount: total,
            onPageChange: handlePageChange,
            onRowsPerPageChange: handleRowsPerPageChange,
          }}
          emptyListComponent={<EmptyList customText="No audit events found" />}
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
