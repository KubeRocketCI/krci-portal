import { HoverInfoLabel } from "@/core/components/HoverInfoLabel";
import type { CRDObject } from "@my-project/shared";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div>
        <HoverInfoLabel label={label} />
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function ScopeGroupConversionRow({ crd }: { crd: CRDObject }) {
  return (
    <div className="grid grid-cols-3 gap-6 py-2">
      <Field label="Scope" value={crd.spec.scope} />
      <Field label="Group" value={crd.spec.group} />
      <Field label="Conversion" value={crd.spec.conversion?.strategy ?? "None"} />
    </div>
  );
}
