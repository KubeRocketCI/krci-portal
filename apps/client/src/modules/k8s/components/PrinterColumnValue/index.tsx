import { Badge } from "@/core/components/ui/badge";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { formatRelativeTime } from "@/core/utils/date-humanize";
import { extractByJsonPath } from "@/modules/k8s/utils/extractByJsonPath";
import { CREATION_TIMESTAMP_PRINTER_COL_PATH } from "@/modules/k8s/registry/dynamic/crdUtils";
import type { CRDVersion, KubeObjectBase } from "@my-project/shared";

type PrinterColumnType = NonNullable<CRDVersion["additionalPrinterColumns"]>[number]["type"];

export interface PrinterColumnValueProps {
  item: KubeObjectBase;
  jsonPath: string;
  type: PrinterColumnType;
}

const EM_DASH = "—";

export function PrinterColumnValue({ item, jsonPath, type }: PrinterColumnValueProps) {
  // Defense-in-depth: column generation already skips creationTimestamp.
  if (jsonPath === CREATION_TIMESTAMP_PRINTER_COL_PATH) return null;

  const value = extractByJsonPath(item, jsonPath);
  if (value == null) return <>{EM_DASH}</>;

  switch (type) {
    case "string":
      // Printer columns frequently surface unbreakable strings (URLs, hashes); the
      // table's cell wrapper is a flex container with default `min-width: auto`, so
      // without an explicit `min-w-0` block here line-clamp can't kick in and the
      // string pushes past the fixed column width into the next column.
      return (
        <div className="w-full min-w-0">
          <TextWithTooltip text={String(value)} maxLineAmount={2} />
        </div>
      );
    case "integer":
    case "number": {
      // Render a dash if the CRD declares a numeric type but the value isn't numeric
      // (malformed CRD or schema/jsonPath mismatch) — String(NaN) === "NaN" otherwise.
      const n = Number(value);
      return <>{Number.isFinite(n) ? String(n) : EM_DASH}</>;
    }
    case "boolean": {
      // Normalize to a tri-state: true | false | unknown.
      // CRD operators commonly serialize booleans as strings ('true'/'false'),
      // so JS truthiness alone is incorrect — 'false' (truthy string) would render as True.
      const isTrue = value === true || (typeof value === "string" && value.toLowerCase() === "true");
      const isFalse = value === false || (typeof value === "string" && value.toLowerCase() === "false");
      if (!isTrue && !isFalse) return <>{EM_DASH}</>;
      return <Badge variant={isTrue ? "success" : "secondary"}>{isTrue ? "True" : "False"}</Badge>;
    }
    case "date":
      // formatRelativeTime returns "-" for invalid timestamps and never throws.
      return <>{formatRelativeTime(String(value))}</>;
    default:
      return <>{EM_DASH}</>;
  }
}
