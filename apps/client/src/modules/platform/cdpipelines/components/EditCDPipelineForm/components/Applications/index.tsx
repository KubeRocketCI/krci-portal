import { EmptyList } from "@/core/components/EmptyList";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/utils/classname";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { Codebase, codebaseLabels, codebaseType } from "@my-project/shared";
import { Check, Package, X } from "lucide-react";
import React from "react";
import { ApplicationRow } from "./components/ApplicationRow";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { useStore } from "@tanstack/react-form";
import { useEditCDPipelineForm } from "../../providers/form/hooks";
import type { EditCDPipelineFormValues } from "../../types";
import { CommandItem } from "@/core/components/ui/command";

export const Applications: React.FC = () => {
  const form = useEditCDPipelineForm();

  const applicationListWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
  });

  const applications = React.useMemo(() => applicationListWatch.data.array, [applicationListWatch.data.array]) as
    | Codebase[]
    | undefined;

  // Map applications to options for FormCombobox
  const applicationOptions = React.useMemo(() => {
    if (!applications) return [];
    return applications.map((app) => ({
      value: app.metadata.name,
      label: app.metadata.name,
    }));
  }, [applications]);

  const fieldArrayValue = useStore(
    form.store,
    (state: { values: EditCDPipelineFormValues }) => state.values.ui_applicationsFieldArray || []
  );

  // Sync applications field array when selection changes
  const handleApplicationsChange = React.useCallback(
    (selectedApps: string[]) => {
      const currentFieldArray = fieldArrayValue || [];

      // Remove branches from inputDockerStreams for apps that were deselected
      const removedApps = currentFieldArray.filter((app) => !selectedApps.includes(app.appName));
      if (removedApps.length > 0) {
        const currentStreams = (form.getFieldValue("inputDockerStreams") as string[]) || [];
        const removedAppNames = new Set(removedApps.map((app) => app.appName));
        // Remove by position using the current field array order (not by branch value)
        const newStreams = currentStreams.filter((_, i) => {
          const appAtPosition = currentFieldArray[i];
          return appAtPosition && !removedAppNames.has(appAtPosition.appName);
        });
        form.setFieldValue("inputDockerStreams", newStreams);
      }

      const newFieldArray = selectedApps.map((appName) => {
        const existing = currentFieldArray.find((app) => app.appName === appName);
        if (existing) {
          return existing;
        }
        return { appName, appBranch: "" };
      });

      form.setFieldValue("ui_applicationsFieldArray", newFieldArray);

      // Sync the applications field (required for submission)
      form.setFieldValue("applications", selectedApps);

      const applicationsToPromoteAllFieldValue = form.getFieldValue("ui_applicationsToPromoteAll") || false;
      form.setFieldValue("applicationsToPromote", applicationsToPromoteAllFieldValue ? selectedApps : []);
    },
    [form, fieldArrayValue]
  );

  return (
    <LoadingWrapper isLoading={applicationListWatch.query.isLoading}>
      <div className="space-y-6">
        {/* Use enhanced FormCombobox with custom rendering */}
        <form.AppField
          name="ui_applicationsToAddChooser"
          listeners={{
            onChange: ({ value }) => handleApplicationsChange(value),
          }}
        >
          {(field) => (
            <field.FormCombobox
              label="Applications"
              placeholder="Select applications..."
              options={applicationOptions}
              multiple
              searchPlaceholder="Search applications..."
              emptyText="No applications found."
              loading={applicationListWatch.query.isLoading}
              data={{ applications, form }}
              popoverContentClassName="z-[1400]"
              renderChip={({ value, onRemove }) => (
                <Badge key={value} className="shrink-0 gap-1.5 pr-1 pl-2">
                  {value}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="hover:bg-input hover:text-foreground ml-1 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              renderOption={({ option, selected, onSelect }) => {
                const app = applications?.find((a) => a.metadata.name === option.value);
                if (!app) return null;

                return (
                  <CommandItem key={option.value} value={option.value} onSelect={onSelect} className="py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Package className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <span className="text-foreground shrink-0 text-sm font-medium">{app.metadata.name}</span>
                      {(app.spec.lang || app.spec.framework) && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          {app.spec.lang && (
                            <UseSpriteSymbol
                              name={app.spec.lang}
                              width={14}
                              height={14}
                              className="text-muted-foreground/70"
                            />
                          )}
                          {app.spec.framework && (
                            <UseSpriteSymbol
                              name={app.spec.framework}
                              width={14}
                              height={14}
                              className="text-muted-foreground/70"
                            />
                          )}
                        </div>
                      )}
                      {app.spec.description && (
                        <span className="text-muted-foreground truncate text-xs">{app.spec.description}</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        selected ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {selected && <Check className="text-primary-foreground h-3 w-3" />}
                    </div>
                  </CommandItem>
                );
              }}
              renderSelectedContent={({ selectedValues, data }) => {
                if (!selectedValues.length) {
                  return (
                    <EmptyList
                      customText="No applications selected"
                      description="Select applications from the dropdown above to configure their deployment branches."
                      icon={<Package className="text-muted-foreground" size={48} />}
                    />
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selectedValues.map((appName) => {
                      const application = data.applications?.find((el) => el.metadata.name === appName);
                      if (!application) return null;
                      const fieldIndex = fieldArrayValue.findIndex((f) => f.appName === appName);

                      return (
                        <ApplicationRow
                          key={appName}
                          application={application}
                          index={fieldIndex >= 0 ? fieldIndex : fieldArrayValue.length}
                          removeRow={() => {
                            const newValue = selectedValues.filter((v) => v !== appName);
                            field.handleChange(newValue);
                          }}
                        />
                      );
                    })}
                  </div>
                );
              }}
            />
          )}
        </form.AppField>

        {/* These fields must be registered with TanStack Form so they participate in
            validation and state subscriptions. They have no UI — syncing happens via
            form.setFieldValue() in handleApplicationsChange above. */}
        <form.AppField name="ui_applicationsFieldArray">{() => null}</form.AppField>
        <form.AppField name="inputDockerStreams">{() => null}</form.AppField>
        <form.AppField name="applications">{() => null}</form.AppField>
      </div>
    </LoadingWrapper>
  );
};
