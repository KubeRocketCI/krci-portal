import { Button } from "@/core/components/ui/button";
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { Combobox } from "@/core/components/ui/combobox";
import { FormField } from "@/core/components/ui/form-field";
import { Label } from "@/core/components/ui/label";
import { cn } from "@/core/utils/classname";
import { TektonResultStatus, tektonResultAnnotations } from "@my-project/shared";
import { ChevronDown, RotateCw, X } from "lucide-react";
import React from "react";
import { defaultFilterValues, tektonResultsPipelineTypeOptions, tektonResultStatusOptions } from "../../constants";
import { TektonResultsFilterProps } from "../../types";

export const TektonResultsFilter = ({
  values,
  onChange,
  data,
  onRefresh,
  isRefreshing,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  totalLoaded,
}: TektonResultsFilterProps) => {
  const isLoading = isRefreshing || isFetchingNextPage;

  const isDirty = React.useMemo(() => {
    return (
      values.status !== defaultFilterValues.status ||
      values.pipelineType !== defaultFilterValues.pipelineType ||
      values.codebases.length > 0
    );
  }, [values]);

  const handleStatusChange = React.useCallback(
    (value: string) => {
      onChange({ ...values, status: value as TektonResultStatus | "all" });
    },
    [values, onChange]
  );

  const handlePipelineTypeChange = React.useCallback(
    (value: string) => {
      onChange({ ...values, pipelineType: value });
    },
    [values, onChange]
  );

  const handleCodebasesChange = React.useCallback(
    (value: string | string[]) => {
      const newCodebases = Array.isArray(value) ? value : [value];
      onChange({ ...values, codebases: newCodebases });
    },
    [values, onChange]
  );

  const handleReset = React.useCallback(() => {
    onChange(defaultFilterValues);
  }, [onChange]);

  const codebaseOptions = React.useMemo(() => {
    const set = new Set(
      data?.map((item) => String(item.annotations?.[tektonResultAnnotations.codebase] || "")).filter(Boolean)
    );
    return Array.from(set)
      .sort()
      .map((codebase) => ({ label: codebase, value: codebase }));
  }, [data]);

  return (
    <>
      {/* Status filter */}
      <div className="col-span-2">
        <FormField label="Status">
          <SelectPrimitive value={values.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {tektonResultStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectPrimitive>
        </FormField>
      </div>

      {/* Pipeline Type filter */}
      <div className="col-span-2">
        <FormField label="Type">
          <SelectPrimitive value={values.pipelineType} onValueChange={handlePipelineTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {tektonResultsPipelineTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectPrimitive>
        </FormField>
      </div>

      {/* Codebase filter */}
      <div className="col-span-3">
        <FormField label="Codebases">
          <Combobox
            options={codebaseOptions}
            value={values.codebases}
            onValueChange={handleCodebasesChange}
            placeholder="Select codebases"
            searchPlaceholder="Search codebases..."
            emptyText="No codebases found"
            multiple
          />
        </FormField>
      </div>

      {/* Clear button - only show when form is dirty */}
      {isDirty && (
        <div className="col-span-1 flex flex-col gap-2">
          <Label>&nbsp;</Label>
          <Button variant="secondary" onClick={handleReset} size="sm" className="mt-0.5">
            <X size={16} />
            Clear
          </Button>
        </div>
      )}

      {/* Stats + Actions - right side */}
      <div className={cn("flex flex-col gap-2", isDirty ? "col-span-4" : "col-span-5")}>
        <Label>&nbsp;</Label>
        <div className="mt-0.5 flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-sm">{totalLoaded} loaded</span>

          {/* Refresh button */}
          <Button variant="dark" onClick={onRefresh} disabled={isLoading} title="Refresh results">
            <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>

          {/* Load More button */}
          {hasNextPage && (
            <Button variant="dark" onClick={onLoadMore} disabled={isLoading}>
              {isFetchingNextPage ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Load More
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
