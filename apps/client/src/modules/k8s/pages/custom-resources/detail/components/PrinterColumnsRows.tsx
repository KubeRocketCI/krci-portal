import { HoverInfoLabel } from "@/core/components/HoverInfoLabel";
import { PrinterColumnValue } from "@/modules/k8s/components/PrinterColumnValue";
import { resolveCRDVersion, CREATION_TIMESTAMP_PRINTER_COL_PATH } from "@/modules/k8s/registry/dynamic/crdUtils";
import type { CRDObject, KubeObjectBase } from "@my-project/shared";

export function PrinterColumnsRows({ crd, item, version }: { crd: CRDObject; item: KubeObjectBase; version: string }) {
  const v = resolveCRDVersion(crd, version);
  // Skip the creationTimestamp printer column — the detail page header already shows
  // creation time, and it's also filtered out of the list view (consistency).
  // Show ALL remaining printer columns (including priority > 0): detail surfaces are
  // intended to give more information than the list summary.
  const cols = (v?.additionalPrinterColumns ?? []).filter((c) => c.jsonPath !== CREATION_TIMESTAMP_PRINTER_COL_PATH);
  if (cols.length === 0) {
    return <p className="text-muted-foreground text-sm">No additional columns defined for this resource.</p>;
  }
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-x-6 gap-y-2">
      {cols.map((c, idx) => (
        // Suffix with idx so a malformed CRD with duplicate printer-column names doesn't
        // produce duplicate React keys (which would mis-render the cell value).
        <div className="contents" key={`${c.name}-${idx}`}>
          <div>
            <HoverInfoLabel label={c.name} tooltip={c.description} />
          </div>
          <div>
            <PrinterColumnValue item={item} jsonPath={c.jsonPath} type={c.type} />
          </div>
        </div>
      ))}
    </div>
  );
}
