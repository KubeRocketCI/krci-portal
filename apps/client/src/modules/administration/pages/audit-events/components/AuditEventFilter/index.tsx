import React from "react";
import { X } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import type { SelectOption } from "@/core/components/form";
import type { KrciAuditFacet } from "@my-project/shared";
import { auditEventFilterControlNames, auditOperationValues } from "./constants";
import { useAuditEventFilter } from "./hooks/useAuditEventFilter";
import { useAuditFacets } from "../../hooks/useAuditFacets";

function toFacetOptions(facet: KrciAuditFacet): SelectOption[] {
  return facet.values.map((value) => ({ label: value, value }));
}

export function AuditEventFilter() {
  const { form, reset, isDefaultValue } = useAuditEventFilter();
  const facets = useAuditFacets();

  const operationOptions: SelectOption[] = React.useMemo(
    () => [{ label: "All", value: "all" }, ...auditOperationValues.map((value) => ({ label: value, value }))],
    []
  );

  const kindOptions = React.useMemo(() => toFacetOptions(facets.kind), [facets.kind]);
  const namespaceOptions = React.useMemo(() => toFacetOptions(facets.namespace), [facets.namespace]);
  const actorOptions = React.useMemo(() => toFacetOptions(facets.actor), [facets.actor]);

  return (
    <>
      <div className="col-span-2">
        <form.AppField name={auditEventFilterControlNames.KIND}>
          {(field) =>
            facets.kind.truncated ? (
              <field.FormTextField label="Kind" placeholder="e.g. PipelineRun" />
            ) : (
              <field.FormCombobox label="Kind" placeholder="Select kind" options={kindOptions} />
            )
          }
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={auditEventFilterControlNames.NAMESPACE}>
          {(field) =>
            facets.namespace.truncated ? (
              <field.FormTextField label="Namespace" placeholder="Namespace" />
            ) : (
              <field.FormCombobox label="Namespace" placeholder="Select namespace" options={namespaceOptions} />
            )
          }
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={auditEventFilterControlNames.OPERATION}>
          {(field) => <field.FormSelect label="Operation" options={operationOptions} placeholder="Select operation" />}
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={auditEventFilterControlNames.ACTOR}>
          {(field) =>
            facets.actor.truncated ? (
              <field.FormTextField label="Actor" placeholder="Username" />
            ) : (
              <field.FormCombobox label="Actor" placeholder="Select actor" options={actorOptions} />
            )
          }
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={auditEventFilterControlNames.FROM}>
          {(field) => <field.FormTextField label="From" placeholder="e.g. 2026-07-01T00:00:00Z" />}
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={auditEventFilterControlNames.TO}>
          {(field) => <field.FormTextField label="To" placeholder="e.g. 2026-07-08T00:00:00Z" />}
        </form.AppField>
      </div>

      {!isDefaultValue && (
        <div className="col-span-1 flex flex-col gap-2">
          <Label> </Label>
          <Button variant="secondary" onClick={reset} size="sm" className="mt-0.5">
            <X size={16} />
            Clear
          </Button>
        </div>
      )}
    </>
  );
}
